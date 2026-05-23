import type { QuoteItem } from '@/types';

export function computeQuoteTotals(
  items: Pick<QuoteItem, 'quantity' | 'unitPrice'>[],
  vatRate: number,
  discount: number,
  discountType: 'AMOUNT' | 'PERCENT',
) {
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const subtotal = round2(items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0));
  const discountAmount = discountType === 'PERCENT' ? round2((subtotal * discount) / 100) : round2(discount || 0);
  const afterDiscount = Math.max(0, round2(subtotal - discountAmount));
  const vatAmount = round2((afterDiscount * vatRate) / 100);
  const total = round2(afterDiscount + vatAmount);
  return { subtotal, discountAmount, afterDiscount, vatAmount, total };
}
