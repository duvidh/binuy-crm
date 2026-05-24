import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { expenseSchema } from '../validators/project.validators.js';

const supplierSchema = z.object({
  name: z.string().min(1),
  field: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  businessId: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const listSuppliers = asyncHandler(async (_req: Request, res: Response) => {
  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { contracts: true, expenses: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(suppliers);
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const input = supplierSchema.parse(req.body);
  const supplier = await prisma.supplier.create({ data: input });
  res.status(201).json(supplier);
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const data = supplierSchema.partial().parse(req.body);
  const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data });
  res.json(supplier);
});

export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
  await prisma.supplier.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  res.json({ ok: true });
});

// --- Expenses ---
export const listExpenses = asyncHandler(async (req: Request, res: Response) => {
  const where: Record<string, unknown> = { deletedAt: null };
  if (req.query.projectId) where.projectId = req.query.projectId;
  if (req.query.supplierId) where.supplierId = req.query.supplierId;
  const expenses = await prisma.expense.findMany({
    where,
    include: { supplier: { select: { name: true } }, project: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(expenses);
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const input = expenseSchema.parse(req.body);
  const expense = await prisma.expense.create({
    data: { ...input, projectId: input.projectId || null, supplierId: input.supplierId || null, date: input.date ?? new Date() },
  });
  res.status(201).json(expense);
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  await prisma.expense.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  res.json({ ok: true });
});
