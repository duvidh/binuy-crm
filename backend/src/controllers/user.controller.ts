import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, conflict } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { hashPassword } from '../utils/password.js';
import { validatePasswordPolicy } from '../services/auth.service.js';
import { USER_ROLES } from '../constants/enums.js';
import { logActivity } from '../services/activity.service.js';

const selectPublic = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
};

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: selectPublic,
    orderBy: { name: 'asc' },
  });
  res.json(users);
});

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(USER_ROLES as [string, ...string[]]),
  phone: z.string().optional(),
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = createSchema.parse(req.body);
  validatePasswordPolicy(input.password);
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('משתמש עם אימייל זה כבר קיים');
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
    },
    select: selectPublic,
  });
  logActivity({ userId: req.user?.userId, entityType: 'User', entityId: user.id, action: 'CREATE' });
  res.status(201).json(user);
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(USER_ROLES as [string, ...string[]]).optional(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input = updateSchema.parse(req.body);
  const data: Record<string, unknown> = { ...input };
  if (input.password) {
    validatePasswordPolicy(input.password);
    data.passwordHash = await hashPassword(input.password);
    delete data.password;
  }
  const user = await prisma.user.update({ where: { id }, data, select: selectPublic });
  logActivity({ userId: req.user?.userId, entityType: 'User', entityId: id, action: 'UPDATE' });
  res.json(user);
});
