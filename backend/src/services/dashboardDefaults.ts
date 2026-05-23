// Default dashboard layouts per role. Widget `i` is a unique instance id,
// `type` maps to the frontend widget registry. Grid is 12 columns.

interface WidgetLayout {
  i: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

const ADMIN: WidgetLayout[] = [
  { i: 'w1', type: 'leadsSummary', x: 0, y: 0, w: 3, h: 2 },
  { i: 'w2', type: 'monthlyConversions', x: 3, y: 0, w: 3, h: 2 },
  { i: 'w3', type: 'paymentsThisMonth', x: 6, y: 0, w: 3, h: 2 },
  { i: 'w4', type: 'pipelineBudget', x: 9, y: 0, w: 3, h: 2 },
  { i: 'w5', type: 'revenueChart', x: 0, y: 2, w: 6, h: 4 },
  { i: 'w6', type: 'salesFunnel', x: 6, y: 2, w: 6, h: 4 },
  { i: 'w7', type: 'leadsByCity', x: 0, y: 6, w: 4, h: 4 },
  { i: 'w8', type: 'leadsByType', x: 4, y: 6, w: 4, h: 4 },
  { i: 'w9', type: 'activeProjects', x: 8, y: 6, w: 4, h: 4 },
  { i: 'w10', type: 'overduePayments', x: 0, y: 10, w: 6, h: 4 },
  { i: 'w11', type: 'pendingQuotes', x: 6, y: 10, w: 6, h: 4 },
];

const SALES: WidgetLayout[] = [
  { i: 'w1', type: 'leadsSummary', x: 0, y: 0, w: 3, h: 2 },
  { i: 'w2', type: 'monthlyConversions', x: 3, y: 0, w: 3, h: 2 },
  { i: 'w3', type: 'conversionRate', x: 6, y: 0, w: 3, h: 2 },
  { i: 'w4', type: 'newCustomers', x: 9, y: 0, w: 3, h: 2 },
  { i: 'w5', type: 'todayTasks', x: 0, y: 2, w: 6, h: 4 },
  { i: 'w6', type: 'overdueTasks', x: 6, y: 2, w: 6, h: 4 },
  { i: 'w7', type: 'salesFunnel', x: 0, y: 6, w: 6, h: 4 },
  { i: 'w8', type: 'pendingQuotes', x: 6, y: 6, w: 6, h: 4 },
];

const PROJECT_MANAGER: WidgetLayout[] = [
  { i: 'w1', type: 'activeProjects', x: 0, y: 0, w: 6, h: 4 },
  { i: 'w2', type: 'todayTasks', x: 6, y: 0, w: 6, h: 4 },
  { i: 'w3', type: 'overdueTasks', x: 0, y: 4, w: 6, h: 4 },
  { i: 'w4', type: 'miniCalendar', x: 6, y: 4, w: 6, h: 4 },
];

export function defaultLayoutForRole(role: string): WidgetLayout[] {
  switch (role) {
    case 'ADMIN':
    case 'ACCOUNTANT':
      return ADMIN;
    case 'PROJECT_MANAGER':
      return PROJECT_MANAGER;
    default:
      return SALES;
  }
}
