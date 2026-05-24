import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unread = await prisma.notification.count({ where: { userId: req.user!.userId, read: false } });
  res.json({ notifications, unread });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { read: true },
  });
  res.json({ ok: true });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.userId, read: false }, data: { read: true } });
  res.json({ ok: true });
});
