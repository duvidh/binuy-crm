import { randomBytes } from 'crypto';
import { prisma } from '../utils/prisma.js';

export interface QuoteItemInput {
  section?: string | null;
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  notes?: string | null;
  order?: number;
}

export interface QuoteTotalsInput {
  items: QuoteItemInput[];
  vatRate: number;
  discount: number;
  discountType: 'AMOUNT' | 'PERCENT';
}

export function computeTotals({ items, vatRate, discount, discountType }: QuoteTotalsInput) {
  const lineTotals = items.map((it) => ({
    ...it,
    total: round2(it.quantity * it.unitPrice),
  }));
  const subtotal = round2(lineTotals.reduce((s, it) => s + it.total, 0));
  const discountAmount =
    discountType === 'PERCENT' ? round2((subtotal * discount) / 100) : round2(discount);
  const afterDiscount = Math.max(0, round2(subtotal - discountAmount));
  const vatAmount = round2((afterDiscount * vatRate) / 100);
  const total = round2(afterDiscount + vatAmount);
  return { lineTotals, subtotal, discountAmount, afterDiscount, vatAmount, total };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// QT-{YEAR}-{SEQ padded to 3}. Sequence resets per year, honors configured start.
// The sequence is allocated atomically via a per-year Counter row inside a
// transaction, so concurrent requests can never receive the same number.
export async function nextQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;
  const company = await prisma.companySettings.findUnique({ where: { id: 'default' } });
  const startNumber = company?.quoteStartNumber ?? 1;
  const counterKey = `quote:${year}`;

  const seq = await prisma.$transaction(async (tx) => {
    const existingCounter = await tx.counter.findUnique({ where: { key: counterKey } });
    if (!existingCounter) {
      // First quote of the year: seed from any pre-existing quotes (legacy data)
      // and the configured start number, then claim the next value.
      const quotes = await tx.quote.findMany({
        where: { quoteNumber: { startsWith: prefix } },
        select: { quoteNumber: true },
      });
      const maxSeq = quotes.reduce(
        (max, q) => Math.max(max, Number(q.quoteNumber.slice(prefix.length)) || 0),
        startNumber - 1,
      );
      const value = maxSeq + 1;
      await tx.counter.create({ data: { key: counterKey, value } });
      return value;
    }
    const value = Math.max(existingCounter.value + 1, startNumber);
    await tx.counter.update({ where: { key: counterKey }, data: { value } });
    return value;
  });

  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export function generateSignToken(): { token: string; expiresAt: Date } {
  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  return { token, expiresAt };
}
