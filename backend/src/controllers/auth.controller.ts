import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { loginSchema, registerSchema } from '../validators/auth.validators.js';
import * as authService from '../services/auth.service.js';

const REFRESH_COOKIE = 'refreshToken';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  authService.validatePasswordPolicy(input.password);
  const result = await authService.register(input);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  res.status(201).json({ user: result.user, accessToken: result.accessToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password, req.ip);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  res.json({ user: result.user, accessToken: result.accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies?.[REFRESH_COOKIE] as string) ?? req.body?.refreshToken;
  const result = await authService.refresh(token);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  res.json({ user: result.user, accessToken: result.accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies?.[REFRESH_COOKIE] as string) ?? req.body?.refreshToken;
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ ok: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId);
  res.json({ user });
});
