import { z } from 'zod';
import { USER_ROLES } from '../constants/enums.js';

export const loginSchema = z.object({
  email: z.string().email('אימייל לא תקין'),
  password: z.string().min(1, 'נדרשת סיסמה'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'שם קצר מדי'),
  email: z.string().email('אימייל לא תקין'),
  password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים'),
  role: z.enum(USER_ROLES as [string, ...string[]]).optional(),
  phone: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
