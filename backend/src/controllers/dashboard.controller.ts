import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import * as dash from '../services/dashboard.service.js';
import { defaultLayoutForRole } from '../services/dashboardDefaults.js';

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await dash.getDashboardStats());
});

export const revenue = asyncHandler(async (req: Request, res: Response) => {
  const months = Math.min(12, Math.max(3, Number(req.query.months) || 6));
  res.json(await dash.getRevenueSeries(months));
});

export const getLayout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const layout = await prisma.dashboardLayout.findUnique({ where: { userId } });
  if (layout) {
    return res.json({ widgets: JSON.parse(layout.layoutJson) });
  }
  res.json({ widgets: defaultLayoutForRole(req.user!.role) });
});

const saveSchema = z.object({
  widgets: z.array(
    z.object({
      i: z.string(),
      type: z.string(),
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
      config: z.record(z.unknown()).optional(),
    }),
  ),
});

export const saveLayout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const input = saveSchema.parse(req.body);
  const layoutJson = JSON.stringify(input.widgets);
  await prisma.dashboardLayout.upsert({
    where: { userId },
    create: { userId, layoutJson },
    update: { layoutJson },
  });
  res.json({ ok: true });
});
