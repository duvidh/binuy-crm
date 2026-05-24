import { z } from 'zod';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_TYPES } from '../constants/enums.js';

export const taskCreateSchema = z.object({
  title: z.string().min(1, 'נדרשת כותרת'),
  description: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  type: z.enum(TASK_TYPES as [string, ...string[]]).optional(),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]).optional(),
  status: z.enum(TASK_STATUSES as [string, ...string[]]).optional(),
  reminder: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export const taskUpdateSchema = taskCreateSchema.partial();
