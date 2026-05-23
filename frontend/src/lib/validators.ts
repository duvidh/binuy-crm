import { z } from 'zod';

export const ISRAELI_PHONE_REGEX = /^0(5\d|2|3|4|7|8|9)\d{7,8}$/;

export function isValidIsraeliId(id: string): boolean {
  const digits = id.replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 9) return false;
  const padded = digits.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(padded[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

export const contactFormSchema = z.object({
  fullName: z.string().min(2, 'יש להזין שם מלא'),
  phone: z
    .string()
    .min(1, 'נדרש טלפון')
    .refine((v) => ISRAELI_PHONE_REGEX.test(v.replace(/[-\s]/g, '')), 'מספר טלפון ישראלי לא תקין'),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  projectType: z.string().optional(),
  areaSqm: z.coerce.number().nonnegative().optional().or(z.nan()),
  budget: z.coerce.number().nonnegative().optional().or(z.nan()),
  leadType: z.enum(['NEW', 'COLD', 'HOT', 'CONVERTED']),
  source: z.string().optional(),
  taxId: z
    .string()
    .optional()
    .refine((v) => !v || isValidIsraeliId(v), 'מספר ת.ז / ח.פ לא תקין'),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
