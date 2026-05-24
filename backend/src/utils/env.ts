import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL', 'file:./dev.db'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  isProd: process.env.NODE_ENV === 'production',
};

// In production, refuse to start with the well-known development secrets.
const DEV_SECRETS = ['dev-access-secret', 'dev-refresh-secret'];
if (env.isProd && (DEV_SECRETS.includes(env.jwtAccessSecret) || DEV_SECRETS.includes(env.jwtRefreshSecret))) {
  throw new Error(
    'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set to strong, non-default values in production.',
  );
}
