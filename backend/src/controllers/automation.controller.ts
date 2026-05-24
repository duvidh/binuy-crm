import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await prisma.automationRule.findMany({
    include: { _count: { select: { executions: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(
    rules.map((r) => ({
      ...r,
      conditions: r.conditionsJson ? JSON.parse(r.conditionsJson) : {},
      actions: r.actionsJson ? JSON.parse(r.actionsJson) : [],
    })),
  );
});

const ruleSchema = z.object({
  name: z.string().min(1),
  triggerType: z.string().min(1),
  conditions: z.record(z.unknown()).optional(),
  actions: z.array(z.record(z.unknown())).optional(),
  isActive: z.boolean().optional(),
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = ruleSchema.parse(req.body);
  const rule = await prisma.automationRule.create({
    data: {
      name: input.name,
      triggerType: input.triggerType,
      conditionsJson: JSON.stringify(input.conditions ?? {}),
      actionsJson: JSON.stringify(input.actions ?? []),
      isActive: input.isActive ?? true,
    },
  });
  res.status(201).json(rule);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const input = ruleSchema.partial().parse(req.body);
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.triggerType !== undefined) data.triggerType = input.triggerType;
  if (input.conditions !== undefined) data.conditionsJson = JSON.stringify(input.conditions);
  if (input.actions !== undefined) data.actionsJson = JSON.stringify(input.actions);
  if (input.isActive !== undefined) data.isActive = input.isActive;
  const rule = await prisma.automationRule.update({ where: { id: req.params.id }, data });
  res.json(rule);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await prisma.automationRule.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
