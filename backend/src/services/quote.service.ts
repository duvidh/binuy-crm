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
export async function nextQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;
  const company = await prisma.companySettings.findUnique({ where: { id: 'default' } });
  const startNumber = company?.quoteStartNumber ?? 1;

  // Compute the max sequence numerically — a lexical `orderBy desc` would treat
  // "999" as greater than "1000" and break (collide/regress) past 999.
  const existing = await prisma.quote.findMany({
    where: { quoteNumber: { startsWith: prefix } },
    select: { quoteNumber: true },
  });
  const maxSeq = existing.reduce(
    (max, q) => Math.max(max, Number(q.quoteNumber.slice(prefix.length)) || 0),
    startNumber - 1,
  );
  const seq = Math.max(maxSeq + 1, startNumber);
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export function generateSignToken(): { token: string; expiresAt: Date } {
  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  return { token, expiresAt };
}
