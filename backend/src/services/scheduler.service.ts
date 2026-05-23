import cron from 'node-cron';
import { logger } from '../utils/logger.js';

// Background jobs (notifications, reminders, permit expiry) are wired up in
// Phase 7. The scheduler is initialized here so the entry point is stable.
export function startScheduler(): void {
  if (process.env.DISABLE_SCHEDULER === 'true') return;
  // Every 5 minutes — placeholder until Phase 7 notification checks land.
  cron.schedule('*/5 * * * *', () => {
    logger.debug('scheduler tick');
  });
}
