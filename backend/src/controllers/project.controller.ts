import type { Request, Response } from 'express';
import { asyncHandler, notFound } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { parseListParams, paginated } from '../utils/query.js';
import { logActivity } from '../services/activity.service.js';
import { projectCreateSchema, projectUpdateSchema } from '../validators/project.validators.js';
import { getProfitability } from '../services/project.service.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const params = parseListParams(req);
  const where: Record<string, unknown> = { deletedAt: null };
  if (req.query.status) where.status = req.query.status;
  if (req.query.managerId) where.managerId = req.query.managerId;
  if (params.search) where.name = { contains: params.search };

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        contact: { select: { id: true, fullName: true } },
        manager: { select: { id: true, name: true } },
        _count: { select: { milestones: true, tasks: true, quotes: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: params.skip,
      take: params.take,
    }),
    prisma.project.count({ where }),
  ]);
  res.json(paginated(data, total, params));
});

export const kanban = asyncHandler(async (_req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    include: { contact: { select: { fullName: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 300,
  });
  res.json(projects);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      contact: { select: { id: true, fullName: true, phone: true } },
      manager: { select: { id: true, name: true } },
      milestones: { orderBy: { order: 'asc' } },
      permits: { orderBy: { createdAt: 'desc' } },
      checklists: { include: { items: { orderBy: { order: 'asc' } } } },
      siteLogs: { orderBy: { date: 'desc' }, take: 50 },
      photos: { orderBy: { createdAt: 'desc' } },
      _count: { select: { quotes: true, tasks: true, documents: true } },
    },
  });
  if (!project) throw notFound('פרויקט לא נמצא');
  const profitability = await getProfitability(project.id);
  res.json({ ...project, profitability });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = projectCreateSchema.parse(req.body);
  const project = await prisma.project.create({ data: input });
  logActivity({ userId: req.user?.userId, entityType: 'Project', entityId: project.id, action: 'CREATE', details: { name: project.name } });
  res.status(201).json(project);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input = projectUpdateSchema.parse(req.body);
  const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw notFound('פרויקט לא נמצא');
  const project = await prisma.project.update({ where: { id }, data: input });
  logActivity({ userId: req.user?.userId, entityType: 'Project', entityId: id, action: 'UPDATE' });
  res.json(project);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await prisma.project.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  logActivity({ userId: req.user?.userId, entityType: 'Project', entityId: req.params.id, action: 'DELETE' });
  res.json({ ok: true });
});

export const profitability = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getProfitability(req.params.id));
});
