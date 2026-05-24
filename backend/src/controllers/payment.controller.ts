import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { parseListParams, paginated } from '../utils/query.js';
import { PAYMENT_STATUSES } from '../constants/enums.js';
import { recomputeBudgetUsed } from '../services/project.service.js';
import { logActivity } from '../services/activity.service.js';

const paymentSchema = z.object({
  contactId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  amount: z.number(),
  date: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional().nullable(),
  method: z.string().optional().nullable(),
  status: z.enum(PAYMENT_STATUSES as [string, ...string[]]).optional(),
  invoiceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const params = parseListParams(req, 'date');
  const where: Record<string, unknown> = { deletedAt: null };
  if (req.query.projectId) where.projectId = req.query.projectId;
  if (req.query.contactId) where.contactId = req.query.contactId;
  if (req.query.status) where.status = req.query.status;

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { contact: { select: { fullName: true } }, project: { select: { name: true } } },
      orderBy: { date: params.sortDir },
      skip: params.skip,
      take: params.take,
    }),
    prisma.payment.count({ where }),
  ]);
  res.json(paginated(data, total, params));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = paymentSchema.parse(req.body);
  const payment = await prisma.payment.create({ data: { ...input, projectId: input.projectId || null, contactId: input.contactId || null } });
  if (payment.projectId) await recomputeBudgetUsed(payment.projectId);
  logActivity({ userId: req.user?.userId, entityType: 'Payment', entityId: payment.id, action: 'CREATE' });
  res.status(201).json(payment);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = paymentSchema.partial().parse(req.body);
  const payment = await prisma.payment.update({ where: { id: req.params.id }, data });
  if (payment.projectId) await recomputeBudgetUsed(payment.projectId);
  res.json(payment);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const payment = await prisma.payment.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  if (payment.projectId) await recomputeBudgetUsed(payment.projectId);
  res.json({ ok: true });
});

// Aging report: open (non-paid) payments bucketed by overdue age.
export const aging = asyncHandler(async (_req: Request, res: Response) => {
  const open = await prisma.payment.findMany({
    where: { deletedAt: null, status: { not: 'PAID' } },
    include: { contact: { select: { fullName: true } }, project: { select: { name: true } } },
  });
  const now = Date.now();
  const buckets = { current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0 };
  const rows = open.map((p) => {
    const ref = p.dueDate ?? p.date;
    const days = Math.floor((now - new Date(ref).getTime()) / 86400000);
    let bucket: keyof typeof buckets = 'current';
    if (days > 90) bucket = 'd90plus';
    else if (days > 60) bucket = 'd90';
    else if (days > 30) bucket = 'd60';
    else if (days > 0) bucket = 'd30';
    buckets[bucket] += p.amount;
    return { id: p.id, contact: p.contact?.fullName, project: p.project?.name, amount: p.amount, days, bucket };
  });
  res.json({ buckets, rows });
});

// Cash flow forecast: expected income (pending payments) by due window.
export const cashflow = asyncHandler(async (req: Request, res: Response) => {
  const horizon = Math.min(90, Math.max(30, Number(req.query.days) || 90));
  const until = new Date(Date.now() + horizon * 86400000);
  const [income, expenses] = await Promise.all([
    prisma.payment.findMany({ where: { deletedAt: null, status: 'PENDING', dueDate: { lte: until } }, select: { amount: true, dueDate: true } }),
    prisma.expense.findMany({ where: { deletedAt: null, date: { lte: until } }, select: { amount: true, date: true } }),
  ]);
  const incomeTotal = income.reduce((s, p) => s + p.amount, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  res.json({ horizon, incomeTotal, expenseTotal, net: incomeTotal - expenseTotal });
});
