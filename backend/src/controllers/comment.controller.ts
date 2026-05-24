import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, notFound } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';

const commentSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  body: z.string().min(1),
  mentionedUserIds: z.array(z.string()).optional(),
});

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId } = req.query as { entityType: string; entityId: string };
  const comments = await prisma.comment.findMany({
    where: { entityType, entityId },
    include: { user: { select: { id: true, name: true } }, mentions: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(comments);
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const input = commentSchema.parse(req.body);
  const userId = req.user!.userId;
  const comment = await prisma.comment.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      userId,
      body: input.body,
      mentions: input.mentionedUserIds?.length
        ? { create: input.mentionedUserIds.map((uid) => ({ userId: uid })) }
        : undefined,
    },
    include: { user: { select: { id: true, name: true } }, mentions: true },
  });

  // Notify mentioned users.
  if (input.mentionedUserIds?.length) {
    await prisma.notification.createMany({
      data: input.mentionedUserIds.map((uid) => ({
        userId: uid,
        type: 'MENTION',
        message: `${comment.user.name} תייג/ה אותך בהערה`,
        link: `/contacts/${input.entityId}`,
      })),
    });
  }
  res.status(201).json(comment);
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  // Only the author may delete their own comment; ADMIN may delete any.
  const isAdmin = req.user?.role === 'ADMIN';
  const where = isAdmin ? { id: req.params.id } : { id: req.params.id, userId: req.user!.userId };
  const { count } = await prisma.comment.deleteMany({ where });
  if (count === 0) throw notFound('הערה לא נמצאה');
  res.json({ ok: true });
});
