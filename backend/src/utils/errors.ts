import type { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const badRequest = (msg: string, details?: unknown) => new AppError(400, msg, details);
export const unauthorized = (msg = 'לא מורשה') => new AppError(401, msg);
export const forbidden = (msg = 'אין הרשאה לפעולה זו') => new AppError(403, msg);
export const notFound = (msg = 'לא נמצא') => new AppError(404, msg);
export const conflict = (msg: string) => new AppError(409, msg);

// Wraps async route handlers so thrown errors reach the error middleware.
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export const asyncHandler =
  (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
