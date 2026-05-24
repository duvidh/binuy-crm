import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';

// --- Audit log ---
export const auditLog = asyncHandler(async (req: Request, res: Response) => {
  const where: Record<string, unknown> = {};
  if (req.query.entityType) where.entityType = req.query.entityType;
  if (req.query.userId) where.userId = req.query.userId;
  if (req.query.action) where.action = req.query.action;
  const logs = await prisma.activityLog.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(logs);
});

// --- Message templates ---
export const listTemplates = asyncHandler(async (req: Request, res: Response) => {
  const where = req.query.channel ? { channel: req.query.channel as string } : {};
  const templates = await prisma.messageTemplate.findMany({ where, orderBy: { name: 'asc' } });
  res.json(templates);
});

const templateSchema = z.object({
  channel: z.enum(['whatsapp', 'sms', 'email']),
  name: z.string().min(1),
  body: z.string().min(1),
});

export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const input = templateSchema.parse(req.body);
  // Extract {{variables}} from the body.
  const variables = [...input.body.matchAll(/\{\{(.+?)\}\}/g)].map((m) => m[1]);
  const template = await prisma.messageTemplate.create({
    data: { ...input, variables: JSON.stringify(variables) },
  });
  res.status(201).json(template);
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  await prisma.messageTemplate.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// --- Trash (soft-deleted items, 30-day window) ---
export const trash = asyncHandler(async (_req: Request, res: Response) => {
  const cutoff = new Date(Date.now() - 30 * 86400000);
  const [contacts, projects, quotes] = await Promise.all([
    prisma.contact.findMany({ where: { deletedAt: { gte: cutoff } }, select: { id: true, fullName: true, deletedAt: true }, take: 100 }),
    prisma.project.findMany({ where: { deletedAt: { gte: cutoff } }, select: { id: true, name: true, deletedAt: true }, take: 100 }),
    prisma.quote.findMany({ where: { deletedAt: { gte: cutoff } }, select: { id: true, quoteNumber: true, deletedAt: true }, take: 100 }),
  ]);
  res.json({
    contacts: contacts.map((c) => ({ id: c.id, label: c.fullName, deletedAt: c.deletedAt, type: 'contact' })),
    projects: projects.map((p) => ({ id: p.id, label: p.name, deletedAt: p.deletedAt, type: 'project' })),
    quotes: quotes.map((q) => ({ id: q.id, label: q.quoteNumber, deletedAt: q.deletedAt, type: 'quote' })),
  });
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = req.params;
  const data = { deletedAt: null };
  if (type === 'contact') await prisma.contact.update({ where: { id }, data });
  else if (type === 'project') await prisma.project.update({ where: { id }, data });
  else if (type === 'quote') await prisma.quote.update({ where: { id }, data });
  res.json({ ok: true });
});

// --- Backups (DB snapshot metadata; SQLite file copy in a fuller impl) ---
export const exportData = asyncHandler(async (_req: Request, res: Response) => {
  const [contacts, projects, quotes, payments] = await Promise.all([
    prisma.contact.findMany({ where: { deletedAt: null } }),
    prisma.project.findMany({ where: { deletedAt: null } }),
    prisma.quote.findMany({ where: { deletedAt: null }, include: { items: true } }),
    prisma.payment.findMany({ where: { deletedAt: null } }),
  ]);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="crm-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(JSON.stringify({ exportedAt: new Date(), contacts, projects, quotes, payments }, null, 2));
});
