import { z } from 'zod';
import { CONTACT_STATUSES, LEAD_TYPES } from '../constants/enums.js';
import { ISRAELI_PHONE_REGEX, isValidIsraeliId } from '../utils/israeli.js';

export const contactCreateSchema = z.object({
  fullName: z.string().min(2, 'יש להזין שם מלא'),
  phone: z
    .string()
    .transform((v) => v.replace(/[-\s]/g, ''))
    .refine((v) => ISRAELI_PHONE_REGEX.test(v), 'מספר טלפון ישראלי לא תקין'),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  projectType: z.string().optional(),
  areaSqm: z.number().nonnegative().optional().nullable(),
  budget: z.number().nonnegative().optional().nullable(),
  leadType: z.enum(LEAD_TYPES as [string, ...string[]]).optional(),
  status: z.enum(CONTACT_STATUSES as [string, ...string[]]).optional(),
  source: z.string().optional(),
  taxId: z
    .string()
    .optional()
    .refine((v) => !v || isValidIsraeliId(v), 'מספר ת.ז / ח.פ לא תקין'),
  assignedToId: z.string().optional().nullable(),
  notes: z.string().optional(),
  lastContactAt: z.coerce.date().optional().nullable(),
  nextFollowUpAt: z.coerce.date().optional().nullable(),
});

export const contactUpdateSchema = contactCreateSchema.partial();

export const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(['assign', 'status', 'leadType', 'delete']),
  value: z.string().optional(),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
