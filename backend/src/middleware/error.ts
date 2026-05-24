import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'הנתיב המבוקש לא נמצא' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'נתונים שגויים',
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error(err);
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  // Map common Prisma errors to proper HTTP status codes instead of a generic 500.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'הרשומה המבוקשת לא נמצאה' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'הערך כבר קיים במערכת' });
  }

  logger.error(err);
  res.status(500).json({ error: 'שגיאת שרת פנימית' });
}
