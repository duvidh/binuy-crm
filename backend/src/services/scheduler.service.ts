import cron from 'node-cron';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { runScheduledRules } from './automation.service.js';

// Avoid sending the same notification repeatedly within a short window.
async function notifyOnce(userId: string, type: string, key: string, message: string, link?: string) {
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: { userId, type, message, createdAt: { gte: since } },
  });
  if (existing) return;
  await prisma.notification.create({ data: { userId, type, message, link: link ?? null } });
}

async function checkTasks() {
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60 * 1000); // next hour

  const upcoming = await prisma.task.findMany({
    where: { deletedAt: null, status: { in: ['OPEN', 'IN_PROGRESS'] }, assignedToId: { not: null }, dueDate: { gte: now, lte: soon } },
  });
  for (const t of upcoming) {
    await notifyOnce(t.assignedToId!, 'TASK_DUE', t.id, `משימה מתקרבת: ${t.title}`, '/tasks');
  }

  const overdue = await prisma.task.findMany({
    where: { deletedAt: null, status: { in: ['OPEN', 'IN_PROGRESS'] }, assignedToId: { not: null }, dueDate: { lt: now } },
    take: 100,
  });
  for (const t of overdue) {
    await notifyOnce(t.assignedToId!, 'TASK_OVERDUE', t.id, `משימה באיחור: ${t.title}`, '/tasks');
  }
}

async function checkPermits() {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400000);
  const expiring = await prisma.permit.findMany({
    where: { expiryDate: { gte: now, lte: in30 } },
    include: { project: { select: { name: true, managerId: true } } },
  });
  for (const p of expiring) {
    const managerId = p.project?.managerId;
    if (managerId) {
      await notifyOnce(managerId, 'PERMIT_EXPIRING', p.id, `היתר עומד לפוג בפרויקט ${p.project?.name}`, '/projects');
    }
  }
}

async function checkOverduePayments() {
  const now = new Date();
  // Flip pending → overdue once past due date.
  await prisma.payment.updateMany({
    where: { deletedAt: null, status: 'PENDING', dueDate: { lt: now } },
    data: { status: 'OVERDUE' },
  });
}

export async function runChecks(): Promise<void> {
  try {
    await checkTasks();
    await checkPermits();
    await checkOverduePayments();
    await runScheduledRules();
  } catch (err) {
    logger.warn({ err }, 'scheduler checks failed');
  }
}

export function startScheduler(): void {
  if (process.env.DISABLE_SCHEDULER === 'true') return;
  // Every 5 minutes.
  cron.schedule('*/5 * * * *', () => {
    void runChecks();
  });
  logger.info('scheduler started (every 5 min)');
}
