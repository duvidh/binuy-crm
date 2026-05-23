import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, badRequest, notFound } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { logActivity } from '../services/activity.service.js';
import { SETTINGS_LIST_TYPES } from '../constants/enums.js';

// --- Dropdown lists ---

export const getLists = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  const where = type ? { listType: type, isActive: true } : { isActive: true };
  const items = await prisma.settingsListItem.findMany({
    where,
    orderBy: [{ listType: 'asc' }, { order: 'asc' }],
  });
  // Group by listType for convenience.
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    (grouped[item.listType] ??= []).push(item);
  }
  res.json({ items, grouped });
});

const listItemSchema = z.object({
  listType: z.enum(SETTINGS_LIST_TYPES as [string, ...string[]]),
  value: z.string().min(1),
  color: z.string().optional(),
  order: z.number().optional(),
});

export const createListItem = asyncHandler(async (req: Request, res: Response) => {
  const input = listItemSchema.parse(req.body);
  const count = await prisma.settingsListItem.count({ where: { listType: input.listType } });
  const item = await prisma.settingsListItem.create({
    data: { ...input, order: input.order ?? count },
  });
  logActivity({ userId: req.user?.userId, entityType: 'SettingsListItem', entityId: item.id, action: 'CREATE' });
  res.status(201).json(item);
});

export const updateListItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = listItemSchema.partial().parse(req.body);
  const item = await prisma.settingsListItem.update({ where: { id }, data });
  res.json(item);
});

export const deleteListItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.settingsListItem.update({ where: { id }, data: { isActive: false } });
  logActivity({ userId: req.user?.userId, entityType: 'SettingsListItem', entityId: id, action: 'DELETE' });
  res.json({ ok: true });
});

export const reorderList = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({ ids: z.array(z.string()) });
  const { ids } = schema.parse(req.body);
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.settingsListItem.update({ where: { id }, data: { order: index } }),
    ),
  );
  res.json({ ok: true });
});

// --- Company settings ---

export const getCompany = asyncHandler(async (_req: Request, res: Response) => {
  let company = await prisma.companySettings.findUnique({ where: { id: 'default' } });
  if (!company) {
    company = await prisma.companySettings.create({ data: { id: 'default' } });
  }
  res.json(company);
});

const companySchema = z.object({
  name: z.string().min(1).optional(),
  businessId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  vatRate: z.number().optional(),
  quoteStartNumber: z.number().optional(),
  invoiceStartNumber: z.number().optional(),
  receiptStartNumber: z.number().optional(),
  withholdingTaxDefault: z.number().optional(),
  exemptDealer: z.boolean().optional(),
  signatureUrl: z.string().optional().nullable(),
});

export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  const data = companySchema.parse(req.body);
  const company = await prisma.companySettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...data },
    update: data,
  });
  logActivity({ userId: req.user?.userId, entityType: 'CompanySettings', entityId: 'default', action: 'UPDATE' });
  res.json(company);
});

// --- Pipeline stages ---

export const getPipelineStages = asyncHandler(async (_req: Request, res: Response) => {
  const stages = await prisma.pipelineStage.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
  res.json(stages);
});

const stageSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  order: z.number().optional(),
});

export const createStage = asyncHandler(async (req: Request, res: Response) => {
  const input = stageSchema.parse(req.body);
  const count = await prisma.pipelineStage.count();
  const stage = await prisma.pipelineStage.create({
    data: { ...input, order: input.order ?? count },
  });
  res.status(201).json(stage);
});

export const updateStage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = stageSchema.partial().parse(req.body);
  const stage = await prisma.pipelineStage.update({ where: { id }, data });
  res.json(stage);
});

export const deleteStage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const inUse = await prisma.contactPipelineEntry.count({ where: { stageId: id } });
  if (inUse > 0) {
    await prisma.pipelineStage.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.pipelineStage.delete({ where: { id } }).catch(() => {
      throw notFound('שלב לא נמצא');
    });
  }
  res.json({ ok: true });
});
