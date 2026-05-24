import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { pinoHttp } from 'pino-http';
import { env } from './utils/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './utils/prisma.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { startScheduler } from './services/scheduler.service.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    // Support a comma-separated list of allowed origins.
    origin: env.clientOrigin.split(',').map((o) => o.trim()).filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

// Global rate limit (auth has its own tighter limiter).
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Static uploads.
app.use('/uploads', express.static(path.resolve(env.uploadDir)));

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  logger.info(`API listening on http://localhost:${env.port}`);
  startScheduler();
});

async function shutdown() {
  logger.info('shutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
