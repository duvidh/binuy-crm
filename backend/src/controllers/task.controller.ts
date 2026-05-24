import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { asyncHandler, notFound } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { logActivity } from '../services/activity.service.js';
import { taskCreateSchema, taskUpdateSchema } from '../validators/task.validators.js';

function rangeFilter(filter?: string): Prisma.TaskWhereInput {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (filter) {
    case 'today': {
      const end = new Date(startOfToday);
      end.setDate(end.getDate() + 1);
      return { dueDate: { gte: startOfToday, lt: end } };
    }
    case 'week': {
      const end = new Date(startOfToday);
      end.setDate(end.getDate() + 7);
      return { dueDate: { gte: startOfToday, lt: end } };
    }
    case 'overdue':
      return { dueDate: { lt: now }, status: { in: ['OPEN', 'IN_PROGRESS'] } };
    default:
      return {};
  }
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const where: Prisma.TaskWhereInput = { deletedAt: null, ...rangeFilter(req.query.filter as string) };
  if (req.query.assignedToId) where.assignedToId = req.query.assignedToId as string;
  if (req.query.status) where.status = req.query.status as string;
  if (req.query.contactId) where.contactId = req.query.contactId as string;
  if (req.query.projectId) where.projectId = req.query.projectId as string;
  if (req.query.type) where.type = req.query.type as string;

  // Optional date window for calendar views.
  if (req.query.from || req.query.to) {
    where.dueDate = {};
    if (req.query.from) (where.dueDate as Prisma.DateTimeFilter).gte = new Date(req.query.from as string);
    if (req.query.to) (where.dueDate as Prisma.DateTimeFilter).lte = new Date(req.query.to as string);
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      contact: { select: { id: true, fullName: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    take: 500,
  });
  res.json(tasks);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = taskCreateSchema.parse(req.body);
  const task = await prisma.task.create({
    data: {
      ...input,
      assignedToId: input.assignedToId || req.user?.userId || null,
      contactId: input.contactId || null,
      projectId: input.projectId || null,
    },
  });
  logActivity({ userId: req.user?.userId, entityType: 'Task', entityId: task.id, action: 'CREATE' });
  res.status(201).json(task);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = taskUpdateSchema.parse(req.body);
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) throw notFound('משימה לא נמצאה');
  const task = await prisma.task.update({ where: { id: req.params.id }, data });
  res.json(task);
});

export const toggleComplete = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) throw notFound('משימה לא נמצאה');
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { status: existing.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED' },
  });
  res.json(task);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await prisma.task.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  res.json({ ok: true });
});
