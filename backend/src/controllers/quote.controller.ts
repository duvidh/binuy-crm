import type { Request, Response } from 'express';
import { asyncHandler, notFound } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { parseListParams, paginated } from '../utils/query.js';
import { logActivity } from '../services/activity.service.js';
import {
  quoteCreateSchema,
  quoteUpdateSchema,
} from '../validators/quote.validators.js';
import * as quoteService from '../services/quote.service.js';
import { fireEvent, TriggerType } from '../services/automation.service.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const params = parseListParams(req, 'date');
  const where: Record<string, unknown> = { deletedAt: null };
  if (req.query.status) where.status = req.query.status;
  if (req.query.contactId) where.contactId = req.query.contactId;
  if (params.search) where.quoteNumber = { contains: params.search };

  const [data, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: { contact: { select: { id: true, fullName: true } }, _count: { select: { items: true } } },
      orderBy: { date: params.sortDir },
      skip: params.skip,
      take: params.take,
    }),
    prisma.quote.count({ where }),
  ]);
  res.json(paginated(data, total, params));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const quote = await prisma.quote.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      contact: true,
      project: { select: { id: true, name: true } },
      items: { orderBy: { order: 'asc' } },
    },
  });
  if (!quote) throw notFound('הצעה לא נמצאה');
  res.json(quote);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = quoteCreateSchema.parse(req.body);
  const totals = quoteService.computeTotals({
    items: input.items,
    vatRate: input.vatRate,
    discount: input.discount,
    discountType: input.discountType,
  });
  const quoteNumber = await quoteService.nextQuoteNumber();

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      contactId: input.contactId,
      projectId: input.projectId || null,
      date: input.date ?? new Date(),
      validUntil: input.validUntil ?? null,
      status: input.status ?? 'DRAFT',
      vatRate: input.vatRate,
      discount: input.discount,
      discountType: input.discountType,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      total: totals.total,
      notes: input.notes ?? null,
      items: {
        create: totals.lineTotals.map((it, idx) => ({
          section: it.section ?? null,
          description: it.description,
          quantity: it.quantity,
          unit: it.unit ?? null,
          unitPrice: it.unitPrice,
          total: it.total,
          notes: it.notes ?? null,
          order: it.order ?? idx,
        })),
      },
    },
    include: { items: true, contact: { select: { fullName: true } } },
  });
  logActivity({ userId: req.user?.userId, entityType: 'Quote', entityId: quote.id, action: 'CREATE', details: { quoteNumber } });
  res.status(201).json(quote);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input = quoteUpdateSchema.parse(req.body);
  const existing = await prisma.quote.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw notFound('הצעה לא נמצאה');

  const items = input.items ?? [];
  const totals = quoteService.computeTotals({
    items,
    vatRate: input.vatRate ?? existing.vatRate,
    discount: input.discount ?? existing.discount,
    discountType: (input.discountType ?? existing.discountType) as 'AMOUNT' | 'PERCENT',
  });

  // Replace line items wholesale when provided.
  const quote = await prisma.$transaction(async (tx) => {
    if (input.items) {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });
    }
    return tx.quote.update({
      where: { id },
      data: {
        contactId: input.contactId ?? existing.contactId,
        projectId: input.projectId === undefined ? existing.projectId : input.projectId || null,
        date: input.date ?? existing.date,
        validUntil: input.validUntil === undefined ? existing.validUntil : input.validUntil,
        status: input.status ?? existing.status,
        vatRate: input.vatRate ?? existing.vatRate,
        discount: input.discount ?? existing.discount,
        discountType: input.discountType ?? existing.discountType,
        notes: input.notes === undefined ? existing.notes : input.notes,
        ...(input.items
          ? {
              subtotal: totals.subtotal,
              vatAmount: totals.vatAmount,
              total: totals.total,
              items: {
                create: totals.lineTotals.map((it, idx) => ({
                  section: it.section ?? null,
                  description: it.description,
                  quantity: it.quantity,
                  unit: it.unit ?? null,
                  unitPrice: it.unitPrice,
                  total: it.total,
                  notes: it.notes ?? null,
                  order: it.order ?? idx,
                })),
              },
            }
          : {}),
      },
      include: { items: { orderBy: { order: 'asc' } }, contact: true },
    });
  });
  logActivity({ userId: req.user?.userId, entityType: 'Quote', entityId: id, action: 'UPDATE' });
  if (input.status === 'ACCEPTED' && existing.status !== 'ACCEPTED') {
    void fireEvent(TriggerType.QUOTE_ACCEPTED, { contactId: quote.contactId, projectId: quote.projectId, entity: quote as unknown as Record<string, unknown> });
  }
  res.json(quote);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await prisma.quote.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  logActivity({ userId: req.user?.userId, entityType: 'Quote', entityId: req.params.id, action: 'DELETE' });
  res.json({ ok: true });
});

export const duplicate = asyncHandler(async (req: Request, res: Response) => {
  const src = await prisma.quote.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { items: true },
  });
  if (!src) throw notFound('הצעה לא נמצאה');
  const quoteNumber = await quoteService.nextQuoteNumber();
  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      contactId: src.contactId,
      projectId: src.projectId,
      status: 'DRAFT',
      vatRate: src.vatRate,
      discount: src.discount,
      discountType: src.discountType,
      subtotal: src.subtotal,
      vatAmount: src.vatAmount,
      total: src.total,
      notes: src.notes,
      items: {
        create: src.items.map((it) => ({
          section: it.section,
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          total: it.total,
          notes: it.notes,
          order: it.order,
        })),
      },
    },
    include: { items: true },
  });
  res.status(201).json(quote);
});

// Generate a tokenized public sign link.
export const send = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const quote = await prisma.quote.findFirst({ where: { id, deletedAt: null } });
  if (!quote) throw notFound('הצעה לא נמצאה');
  const { token, expiresAt } = quoteService.generateSignToken();
  await prisma.quote.update({
    where: { id },
    data: { signToken: token, signTokenExpiresAt: expiresAt, status: quote.status === 'DRAFT' ? 'SENT' : quote.status },
  });
  logActivity({ userId: req.user?.userId, entityType: 'Quote', entityId: id, action: 'SEND' });
  res.json({ token, signUrl: `/quote/sign/${token}` });
});

// --- Price catalog ---

export const listCatalog = asyncHandler(async (_req: Request, res: Response) => {
  const items = await prisma.priceCatalogItem.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
  res.json(items);
});

export const createCatalogItem = asyncHandler(async (req: Request, res: Response) => {
  const { name, unit, defaultPrice, category } = req.body;
  const item = await prisma.priceCatalogItem.create({
    data: { name, unit, defaultPrice: Number(defaultPrice) || 0, category },
  });
  res.status(201).json(item);
});

export const deleteCatalogItem = asyncHandler(async (req: Request, res: Response) => {
  await prisma.priceCatalogItem.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  res.json({ ok: true });
});
