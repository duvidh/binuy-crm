import { z } from 'zod';
import { PROJECT_STATUSES } from '../constants/enums.js';

export const projectCreateSchema = z.object({
  name: z.string().min(2, 'יש להזין שם פרויקט'),
  contactId: z.string().min(1, 'יש לבחור לקוח'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  projectType: z.string().optional().nullable(),
  status: z.enum(PROJECT_STATUSES as [string, ...string[]]).optional(),
  startDatePlanned: z.coerce.date().optional().nullable(),
  endDatePlanned: z.coerce.date().optional().nullable(),
  startDateActual: z.coerce.date().optional().nullable(),
  endDateActual: z.coerce.date().optional().nullable(),
  budget: z.number().nonnegative().optional().nullable(),
  managerId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const milestoneSchema = z.object({
  name: z.string().min(1),
  order: z.number().optional(),
  plannedDate: z.coerce.date().optional().nullable(),
  actualDate: z.coerce.date().optional().nullable(),
  progressPct: z.number().min(0).max(100).optional(),
  status: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  paymentId: z.string().optional().nullable(),
});

export const permitSchema = z.object({
  fileNumber: z.string().optional().nullable(),
  gush: z.string().optional().nullable(),
  helka: z.string().optional().nullable(),
  status: z.string().optional(),
  issuedDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
});

export const siteLogSchema = z.object({
  date: z.coerce.date().optional(),
  workersCount: z.number().min(0).optional(),
  workDone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const expenseSchema = z.object({
  projectId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  amount: z.number().nonnegative(),
  date: z.coerce.date().optional(),
  description: z.string().optional().nullable(),
});

export const checklistFromTemplateSchema = z.object({
  templateId: z.string().optional().nullable(),
  name: z.string().min(1),
  items: z.array(z.string()).optional(),
});
