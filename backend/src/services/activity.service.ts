import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

interface LogParams {
  userId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  details?: unknown;
}

// Fire-and-forget activity log. Never throws into the request path.
export function logActivity({ userId, entityType, entityId, action, details }: LogParams): void {
  prisma.activityLog
    .create({
      data: {
        userId: userId ?? null,
        entityType,
        entityId: entityId ?? null,
        action,
        details: details ? JSON.stringify(details) : null,
      },
    })
    .catch((err) => logger.warn({ err }, 'failed to write activity log'));
}
