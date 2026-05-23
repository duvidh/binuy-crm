import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const entityType = (req.query.entityType as string) || 'contact';
  const tags = await prisma.tag.findMany({ where: { entityType } });
  res.json(tags);
});

const tagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  entityType: z.string().default('contact'),
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = tagSchema.parse(req.body);
  const tag = await prisma.tag.create({ data: input });
  res.status(201).json(tag);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await prisma.tag.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Attach/detach a tag to a contact.
const assignSchema = z.object({ tagId: z.string(), contactId: z.string() });

export const attach = asyncHandler(async (req: Request, res: Response) => {
  const { tagId, contactId } = assignSchema.parse(req.body);
  const existing = await prisma.entityTag.findFirst({ where: { tagId, contactId, entityType: 'contact' } });
  if (existing) return res.json(existing);
  const link = await prisma.entityTag.create({
    data: { tagId, contactId, entityType: 'contact', entityId: contactId },
  });
  res.status(201).json(link);
});

export const detach = asyncHandler(async (req: Request, res: Response) => {
  const { tagId, contactId } = assignSchema.parse(req.body);
  await prisma.entityTag.deleteMany({ where: { tagId, contactId } });
  res.json({ ok: true });
});
