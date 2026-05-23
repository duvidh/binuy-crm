import { he } from '@/locales/he';
import type { BadgeProps } from '@/components/ui/badge';
import type { LeadType, ContactStatus, QuoteStatus } from '@/types';

export const leadTypeVariant: Record<LeadType, BadgeProps['variant']> = {
  NEW: 'default',
  HOT: 'destructive',
  COLD: 'secondary',
  CONVERTED: 'success',
};

export function leadTypeLabel(t: LeadType) {
  return he.contacts.leadType[t] ?? t;
}

export function statusLabel(s: ContactStatus) {
  return he.contacts.status[s] ?? s;
}

export const quoteStatusVariant: Record<QuoteStatus, BadgeProps['variant']> = {
  DRAFT: 'secondary',
  SENT: 'default',
  ACCEPTED: 'success',
  REJECTED: 'destructive',
  EXPIRED: 'warning',
  SIGNED: 'success',
};

export function quoteStatusLabel(s: QuoteStatus) {
  return he.quotes.statuses[s] ?? s;
}
