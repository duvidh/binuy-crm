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

  const last = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: prefix } },
    orderBy: { quoteNumber: 'desc' },
    select: { quoteNumber: true },
  });
  const lastSeq = last ? Number(last.quoteNumber.split('-')[2]) : startNumber - 1;
  const seq = Math.max(lastSeq + 1, startNumber);
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export function generateSignToken(): { token: string; expiresAt: Date } {
  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  return { token, expiresAt };
}
