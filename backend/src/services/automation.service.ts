import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// Trigger types the engine understands.
export const TriggerType = {
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_IDLE: 'LEAD_IDLE',
  QUOTE_ACCEPTED: 'QUOTE_ACCEPTED',
  PROJECT_STATUS_CHANGED: 'PROJECT_STATUS_CHANGED',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
} as const;

interface ActionContext {
  contactId?: string | null;
  projectId?: string | null;
  entity?: Record<string, unknown>;
}

interface Action {
  type: string; // CREATE_TASK | ASSIGN | CHANGE_LEAD_TYPE | NOTIFY | SEND_WHATSAPP | SEND_SMS | SEND_EMAIL
  [key: string]: unknown;
}

function parse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Returns true if every condition matches the entity.
function conditionsMatch(conditions: Record<string, unknown>, entity?: Record<string, unknown>): boolean {
  if (!entity) return true;
  for (const [key, value] of Object.entries(conditions)) {
    // idleDays / overdueDays are handled by the scheduler, not field equality.
    if (key === 'idleDays' || key === 'overdueDays') continue;
    if (entity[key] !== value) return false;
  }
  return true;
}

async function executeActions(actions: Action[], ctx: ActionContext, ruleId: string) {
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'CREATE_TASK':
          await prisma.task.create({
            data: {
              title: String(action.title ?? 'משימה אוטומטית'),
              description: action.description ? String(action.description) : null,
              contactId: ctx.contactId ?? null,
              projectId: ctx.projectId ?? null,
              assignedToId: action.assignedToId ? String(action.assignedToId) : null,
              type: 'TASK',
              priority: String(action.priority ?? 'NORMAL'),
              dueDate: action.dueInDays ? new Date(Date.now() + Number(action.dueInDays) * 86400000) : new Date(),
            },
          });
          break;
        case 'ASSIGN':
          if (ctx.contactId && action.userId) {
            await prisma.contact.update({ where: { id: ctx.contactId }, data: { assignedToId: String(action.userId) } });
          }
          break;
        case 'CHANGE_LEAD_TYPE':
          if (ctx.contactId && action.value) {
            await prisma.contact.update({ where: { id: ctx.contactId }, data: { leadType: String(action.value) } });
          }
          break;
        case 'NOTIFY':
          if (action.userId) {
            await prisma.notification.create({
              data: { userId: String(action.userId), type: 'AUTOMATION', message: String(action.message ?? 'התראת אוטומציה') },
            });
          }
          break;
        // Outgoing channels are logged (no external provider integrated).
        case 'SEND_WHATSAPP':
        case 'SEND_SMS':
        case 'SEND_EMAIL':
          await prisma.sentMessage.create({
            data: {
              contactId: ctx.contactId ?? null,
              channel: action.type.replace('SEND_', '').toLowerCase(),
              templateId: action.templateId ? String(action.templateId) : null,
              body: String(action.body ?? ''),
              status: 'QUEUED',
            },
          });
          break;
        default:
          logger.warn({ action: action.type }, 'unknown automation action');
      }
    } catch (err) {
      logger.warn({ err, action: action.type }, 'automation action failed');
    }
  }
  await prisma.automationExecution.create({
    data: { ruleId, entityId: ctx.contactId ?? ctx.projectId ?? null, result: 'OK' },
  });
}

// Event-based triggers fired from controllers.
export async function fireEvent(triggerType: string, ctx: ActionContext): Promise<void> {
  const rules = await prisma.automationRule.findMany({ where: { triggerType, isActive: true } });
  for (const rule of rules) {
    const conditions = parse<Record<string, unknown>>(rule.conditionsJson, {});
    if (!conditionsMatch(conditions, ctx.entity)) continue;
    const actions = parse<Action[]>(rule.actionsJson, []);
    await executeActions(actions, ctx, rule.id);
  }
}

// Time-based triggers, evaluated by the scheduler.
export async function runScheduledRules(): Promise<void> {
  const rules = await prisma.automationRule.findMany({ where: { isActive: true } });

  for (const rule of rules) {
    const conditions = parse<Record<string, unknown>>(rule.conditionsJson, {});
    const actions = parse<Action[]>(rule.actionsJson, []);

    if (rule.triggerType === TriggerType.LEAD_IDLE) {
      const days = Number(conditions.idleDays ?? 7);
      const cutoff = new Date(Date.now() - days * 86400000);
      const idle = await prisma.contact.findMany({
        where: { deletedAt: null, status: 'LEAD', updatedAt: { lt: cutoff } },
        take: 100,
      });
      for (const c of idle) {
        // Avoid duplicate task spam: skip if an open follow-up already exists.
        const existing = await prisma.task.findFirst({ where: { contactId: c.id, status: { in: ['OPEN', 'IN_PROGRESS'] }, deletedAt: null } });
        if (existing) continue;
        await executeActions(actions, { contactId: c.id, entity: c as unknown as Record<string, unknown> }, rule.id);
      }
    }

    if (rule.triggerType === TriggerType.PAYMENT_OVERDUE) {
      const days = Number(conditions.overdueDays ?? 14);
      const cutoff = new Date(Date.now() - days * 86400000);
      const overdue = await prisma.payment.findMany({
        where: { deletedAt: null, status: 'PENDING', dueDate: { lt: cutoff } },
        take: 100,
      });
      for (const p of overdue) {
        await prisma.payment.update({ where: { id: p.id }, data: { status: 'OVERDUE' } });
        await executeActions(actions, { contactId: p.contactId, projectId: p.projectId, entity: p as unknown as Record<string, unknown> }, rule.id);
      }
    }
  }
}
