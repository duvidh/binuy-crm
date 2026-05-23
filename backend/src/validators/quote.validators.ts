import { z } from 'zod';
import { QUOTE_STATUSES } from '../constants/enums.js';

export const quoteItemSchema = z.object({
  section: z.string().optional().nullable(),
  description: z.string().min(1, 'נדרש תיאור'),
  quantity: z.number().nonnegative(),
  unit: z.string().optional().nullable(),
  unitPrice: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
  order: z.number().optional(),
});

export const quoteCreateSchema = z.object({
  contactId: z.string().min(1, 'יש לבחור לקוח'),
  projectId: z.string().optional().nullable(),
  date: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional().nullable(),
  status: z.enum(QUOTE_STATUSES as [string, ...string[]]).optional(),
  vatRate: z.number().min(0).max(100).default(18),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['AMOUNT', 'PERCENT']).default('AMOUNT'),
  notes: z.string().optional().nullable(),
  items: z.array(quoteItemSchema).default([]),
});

export const quoteUpdateSchema = quoteCreateSchema.partial();

export const signSchema = z.object({
  signatureData: z.string().min(1, 'נדרשת חתימה'),
  signerName: z.string().min(2, 'נדרש שם החותם'),
});
