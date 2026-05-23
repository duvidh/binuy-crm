// Allowed values for string-modeled "enums" (SQLite has no native enum support).
// Enforced via Zod at the API boundary.

export const UserRole = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  VIEWER: 'VIEWER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const USER_ROLES = Object.values(UserRole);

export const ContactStatus = {
  LEAD: 'LEAD',
  CUSTOMER: 'CUSTOMER',
} as const;
export const CONTACT_STATUSES = Object.values(ContactStatus);

export const LeadType = {
  NEW: 'NEW',
  COLD: 'COLD',
  HOT: 'HOT',
  CONVERTED: 'CONVERTED',
} as const;
export const LEAD_TYPES = Object.values(LeadType);

export const ProjectStatus = {
  PLANNING: 'PLANNING',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export const PROJECT_STATUSES = Object.values(ProjectStatus);

export const QuoteStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  SIGNED: 'SIGNED',
} as const;
export const QUOTE_STATUSES = Object.values(QuoteStatus);

export const TaskStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export const TASK_STATUSES = Object.values(TaskStatus);

export const TaskType = {
  TASK: 'TASK',
  MEETING: 'MEETING',
  CALL: 'CALL',
  SITE_VISIT: 'SITE_VISIT',
  REMINDER: 'REMINDER',
} as const;
export const TASK_TYPES = Object.values(TaskType);

export const TaskPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export const TASK_PRIORITIES = Object.values(TaskPriority);

export const PaymentStatus = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  OVERDUE: 'OVERDUE',
} as const;
export const PAYMENT_STATUSES = Object.values(PaymentStatus);

export const InvoiceType = {
  TAX_INVOICE: 'TAX_INVOICE',
  RECEIPT: 'RECEIPT',
  TAX_INVOICE_RECEIPT: 'TAX_INVOICE_RECEIPT',
} as const;
export const INVOICE_TYPES = Object.values(InvoiceType);

export const SettingsListType = {
  city: 'city',
  projectType: 'projectType',
  leadSource: 'leadSource',
  taskType: 'taskType',
  unit: 'unit',
  paymentMethod: 'paymentMethod',
  documentCategory: 'documentCategory',
  expenseCategory: 'expenseCategory',
} as const;
export const SETTINGS_LIST_TYPES = Object.values(SettingsListType);
