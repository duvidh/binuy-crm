import type { Request, Response } from 'express';
import { asyncHandler, notFound } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { fileUrl } from '../middleware/upload.js';
import {
  milestoneSchema,
  permitSchema,
  siteLogSchema,
  checklistFromTemplateSchema,
} from '../validators/project.validators.js';

// --- Milestones ---
export const createMilestone = asyncHandler(async (req: Request, res: Response) => {
  const input = milestoneSchema.parse(req.body);
  const count = await prisma.projectMilestone.count({ where: { projectId: req.params.id } });
  const m = await prisma.projectMilestone.create({
    data: { ...input, projectId: req.params.id, order: input.order ?? count },
  });
  res.status(201).json(m);
});

export const updateMilestone = asyncHandler(async (req: Request, res: Response) => {
  const data = milestoneSchema.partial().parse(req.body);
  const m = await prisma.projectMilestone.update({ where: { id: req.params.milestoneId }, data });
  res.json(m);
});

export const deleteMilestone = asyncHandler(async (req: Request, res: Response) => {
  await prisma.projectMilestone.delete({ where: { id: req.params.milestoneId } });
  res.json({ ok: true });
});

// --- Permits ---
export const createPermit = asyncHandler(async (req: Request, res: Response) => {
  const input = permitSchema.parse(req.body);
  const p = await prisma.permit.create({ data: { ...input, projectId: req.params.id } });
  res.status(201).json(p);
});

export const updatePermit = asyncHandler(async (req: Request, res: Response) => {
  const data = permitSchema.partial().parse(req.body);
  const p = await prisma.permit.update({ where: { id: req.params.permitId }, data });
  res.json(p);
});

export const deletePermit = asyncHandler(async (req: Request, res: Response) => {
  await prisma.permit.delete({ where: { id: req.params.permitId } });
  res.json({ ok: true });
});

// --- Checklists ---
export const createChecklist = asyncHandler(async (req: Request, res: Response) => {
  const input = checklistFromTemplateSchema.parse(req.body);
  let items = input.items ?? [];
  if (input.templateId) {
    const tpl = await prisma.checklistTemplate.findUnique({ where: { id: input.templateId } });
    if (tpl) items = JSON.parse(tpl.itemsJson) as string[];
  }
  const checklist = await prisma.checklist.create({
    data: {
      projectId: req.params.id,
      templateId: input.templateId ?? null,
      name: input.name,
      items: { create: items.map((text, order) => ({ text, order })) },
    },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  res.status(201).json(checklist);
});

export const toggleChecklistItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.checklistItem.findUnique({ where: { id: req.params.itemId } });
  if (!item) throw notFound('פריט לא נמצא');
  const updated = await prisma.checklistItem.update({
    where: { id: item.id },
    data: {
      completed: !item.completed,
      completedAt: !item.completed ? new Date() : null,
      completedById: !item.completed ? req.user?.userId : null,
    },
  });
  res.json(updated);
});

export const deleteChecklist = asyncHandler(async (req: Request, res: Response) => {
  await prisma.checklist.delete({ where: { id: req.params.checklistId } });
  res.json({ ok: true });
});

export const listChecklistTemplates = asyncHandler(async (req: Request, res: Response) => {
  const where = req.query.projectType ? { projectType: req.query.projectType as string } : {};
  const tpls = await prisma.checklistTemplate.findMany({ where });
  res.json(tpls.map((t) => ({ ...t, items: JSON.parse(t.itemsJson) as string[] })));
});

// --- Site log ---
export const createSiteLog = asyncHandler(async (req: Request, res: Response) => {
  const input = siteLogSchema.parse(req.body);
  const entry = await prisma.siteLogEntry.create({
    data: {
      projectId: req.params.id,
      date: input.date ?? new Date(),
      workersCount: input.workersCount ?? 0,
      workDone: input.workDone ?? null,
      notes: input.notes ?? null,
      createdById: req.user?.userId,
    },
  });
  res.status(201).json(entry);
});

export const deleteSiteLog = asyncHandler(async (req: Request, res: Response) => {
  await prisma.siteLogEntry.delete({ where: { id: req.params.logId } });
  res.json({ ok: true });
});

// --- Photos (multipart upload) ---
export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) throw notFound('לא התקבל קובץ');
  const photo = await prisma.projectPhoto.create({
    data: {
      projectId: req.params.id,
      filePath: fileUrl(file.filename),
      phase: (req.body.phase as string) || 'during',
      caption: (req.body.caption as string) || null,
      takenAt: new Date(),
      uploadedById: req.user?.userId,
    },
  });
  res.status(201).json(photo);
});

export const deletePhoto = asyncHandler(async (req: Request, res: Response) => {
  await prisma.projectPhoto.delete({ where: { id: req.params.photoId } });
  res.json({ ok: true });
});
