import { prisma } from '../utils/prisma.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { badRequest, conflict, unauthorized } from '../utils/errors.js';
import { logActivity } from './activity.service.js';
import { env } from '../utils/env.js';

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

function publicUser(u: {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    twoFactorEnabled: u.twoFactorEnabled,
  };
}

async function issueTokens(user: { id: string; role: string; name: string; email: string }) {
  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  const refreshToken = signRefreshToken(user.id);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
  return { accessToken, refreshToken };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('משתמש עם אימייל זה כבר קיים');

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role ?? 'SALES',
      phone: input.phone,
    },
  });
  logActivity({ userId: user.id, entityType: 'User', entityId: user.id, action: 'CREATE' });
  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function login(email: string, password: string, ip?: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  const recordAttempt = (success: boolean) =>
    prisma.loginAttempt.create({ data: { email, ip, success } }).catch(() => {});

  if (!user || user.deletedAt) {
    await recordAttempt(false);
    throw unauthorized('אימייל או סיסמה שגויים');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await recordAttempt(false);
    throw unauthorized('החשבון נעול זמנית עקב ריבוי נסיונות כושלים. נסה שוב מאוחר יותר');
  }

  if (!user.isActive) {
    await recordAttempt(false);
    throw unauthorized('החשבון מושבת');
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    // If a previous lock has already expired, start the counter fresh so the
    // user gets a full new window instead of being re-locked on one attempt.
    const lockExpired = user.lockedUntil != null && user.lockedUntil <= new Date();
    const attempts = (lockExpired ? 0 : user.failedLoginAttempts) + 1;
    const lockedUntil =
      attempts >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts, lockedUntil },
    });
    await recordAttempt(false);
    throw unauthorized('אימייל או סיסמה שגויים');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await recordAttempt(true);
  logActivity({ userId: user.id, entityType: 'User', entityId: user.id, action: 'LOGIN' });

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  if (!refreshToken) throw unauthorized('חסר refresh token');
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized('refresh token לא תקין');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) throw unauthorized('יש להתחבר מחדש');

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive) throw unauthorized('המשתמש אינו פעיל');

  // Rotate refresh token.
  await prisma.refreshToken.delete({ where: { token: refreshToken } }).catch(() => {});
  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function logout(refreshToken?: string) {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized();
  return publicUser(user);
}

export function validatePasswordPolicy(password: string) {
  // min 8 chars, uppercase, number, special char
  const ok = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
  if (!ok) {
    throw badRequest(
      'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, מספר וסימן מיוחד',
    );
  }
}

export const _config = { MAX_FAILED, LOCK_MINUTES, env };
