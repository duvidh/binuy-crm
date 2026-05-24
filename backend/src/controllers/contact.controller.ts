import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, badRequest, notFound } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { parseListParams, paginated } from '../utils/query.js';
import { logActivity } from '../services/activity.service.js';
import {
  contactCreateSchema,
  contactUpdateSchema,
  bulkActionSchema,
} from '../validators/contact.validators.js';
import * as contactService from '../services/contact.service.js';
import { fireEvent, TriggerType } from '../services/automation.service.js';
import { CONTACT_STATUSES, LEAD_TYPES } from '../constants/enums.js';

function cleanEmail<T extends { email?: string | unknown }>(data: T): T {
  if (data.email === '') (data as { email?: string | null }).email = null;
  return data;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const params = parseListParams(req);
  const filters: contactService.ContactFilters = {
    city: req.query.city as string,
    projectType: req.query.projectType as string,
    leadType: req.query.leadType as string,
    status: req.query.status as string,
    source: req.query.source as string,
    assignedToId: req.query.assignedToId as string,
    tagId: req.query.tagId as string,
    budgetMin: req.query.budgetMin ? Number(req.query.budgetMin) : undefined,
    budgetMax: req.query.budgetMax ? Number(req.query.budgetMax) : undefined,
  };
  const { data, total } = await contactService.listContacts(params, filters);
  res.json(paginated(data, total, params));
});

// Lightweight list for kanban — grouped client-side, no pagination.
export const kanban = asyncHandler(async (req: Request, res: Response) => {
  const contacts = await prisma.contact.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    take: 500,
    include: {
      assignedTo: { select: { id: true, name: true } },
      entityTags: { include: { tag: true } },
    },
  });
  res.json(contacts);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const contact = await contactService.getContact(req.params.id);
  if (!contact) throw notFound('ליד/לקוח לא נמצא');
  res.json(contact);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = cleanEmail(contactCreateSchema.parse(req.body));
  const contact = await prisma.contact.create({ data: input });
  logActivity({
    userId: req.user?.userId,
    entityType: 'Contact',
    entityId: contact.id,
    action: 'CREATE',
    details: { fullName: contact.fullName },
  });
  void fireEvent(TriggerType.LEAD_CREATED, { contactId: contact.id, entity: contact as unknown as Record<string, unknown> });
  res.status(201).json(contact);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input = cleanEmail(contactUpdateSchema.parse(req.body));
  const existing = await prisma.contact.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw notFound('ליד/לקוח לא נמצא');
  const contact = await prisma.contact.update({ where: { id }, data: input });
  logActivity({ userId: req.user?.userId, entityType: 'Contact', entityId: id, action: 'UPDATE' });
  res.json(contact);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  logActivity({ userId: req.user?.userId, entityType: 'Contact', entityId: id, action: 'DELETE' });
  res.json({ ok: true });
});

export const convert = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.contact.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw notFound('ליד/לקוח לא נמצא');
  const contact = await contactService.convertToCustomer(id);
  logActivity({ userId: req.user?.userId, entityType: 'Contact', entityId: id, action: 'CONVERT' });
  res.json(contact);
});

export const moveStage = asyncHandler(async (req: Request, res: Response) => {
  const { stageId } = z.object({ stageId: z.string().min(1) }).parse(req.body);
  const entry = await contactService.moveToStage(req.params.id, stageId);
  logActivity({ userId: req.user?.userId, entityType: 'Contact', entityId: req.params.id, action: 'PIPELINE_MOVE', details: { stageId } });
  res.status(201).json(entry);
});

export const bulk = asyncHandler(async (req: Request, res: Response) => {
  const { ids, action, value } = bulkActionSchema.parse(req.body);
  switch (action) {
    case 'assign':
      await prisma.contact.updateMany({ where: { id: { in: ids } }, data: { assignedToId: value || null } });
      break;
    case 'status':
      if (!value || !(CONTACT_STATUSES as readonly string[]).includes(value)) throw badRequest('ערך סטטוס לא תקין');
      await prisma.contact.updateMany({ where: { id: { in: ids } }, data: { status: value } });
      break;
    case 'leadType':
      if (!value || !(LEAD_TYPES as readonly string[]).includes(value)) throw badRequest('ערך סוג ליד לא תקין');
      await prisma.contact.updateMany({ where: { id: { in: ids } }, data: { leadType: value } });
      break;
    case 'delete':
      await prisma.contact.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
      break;
  }
  logActivity({ userId: req.user?.userId, entityType: 'Contact', action: `BULK_${action.toUpperCase()}`, details: { count: ids.length } });
  res.json({ ok: true, count: ids.length });
});

// CSV export (UTF-8 BOM so Excel renders Hebrew correctly).
export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const contacts = await prisma.contact.findMany({
    where: { deletedAt: null },
    include: { assignedTo: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const headers = ['שם מלא', 'טלפון', 'אימייל', 'עיר', 'סוג פרויקט', 'תקציב', 'סוג ליד', 'סטטוס', 'מקור', 'משויך ל', 'הערות'];
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = contacts.map((c) =>
    [c.fullName, c.phone, c.email, c.city, c.projectType, c.budget, c.leadType, c.status, c.source, c.assignedTo?.name, c.notes]
      .map(escape)
      .join(','),
  );
  const csv = '﻿' + [headers.map(escape).join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
  res.send(csv);
});

// CSV/JSON import — accepts an array of contact rows.
export const importContacts = asyncHandler(async (req: Request, res: Response) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (rows.length === 0) throw badRequest('לא התקבלו שורות לייבוא');
  let created = 0;
  const errors: { row: number; error: string }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const parsed = contactCreateSchema.safeParse(rows[i]);
    if (!parsed.success) {
      errors.push({ row: i + 1, error: 'נתונים שגויים' });
      continue;
    }
    await prisma.contact.create({ data: cleanEmail(parsed.data) });
    created++;
  }
  logActivity({ userId: req.user?.userId, entityType: 'Contact', action: 'IMPORT', details: { created } });
  res.json({ created, errors });
});

// Generate (or reuse) a client-portal token for this contact.
export const portalToken = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const contact = await prisma.contact.findFirst({ where: { id, deletedAt: null } });
  if (!contact) throw notFound('ליד/לקוח לא נמצא');
  const { randomBytes } = await import('crypto');
  const token = randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + 90 * 86400000);
  await prisma.clientPortalToken.create({ data: { contactId: id, token, expiresAt } });
  res.json({ token, portalUrl: `/portal/${token}` });
});

// Timeline of activity entries that reference this contact.
export const activity = asyncHandler(async (req: Request, res: Response) => {
  const logs = await prisma.activityLog.findMany({
    where: { entityType: 'Contact', entityId: req.params.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(logs);
});
