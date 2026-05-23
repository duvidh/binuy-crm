import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized('נדרשת התחברות'));
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(unauthorized('הטוקן פג תוקף או אינו תקין'));
  }
}

// Role-based access control. Pass the roles allowed to hit the route.
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(forbidden());
    }
    next();
  };
}
