import type { ComponentType } from 'react';
import * as W from './widgets';
import { he } from '@/locales/he';

export type WidgetCategory = 'kpi' | 'lists' | 'charts' | 'calendar';

export interface WidgetMeta {
  type: string;
  name: string;
  component: ComponentType;
  defaultSize: { w: number; h: number };
  category: WidgetCategory;
}

export const WIDGET_REGISTRY: Record<string, WidgetMeta> = {
  leadsSummary: { type: 'leadsSummary', name: he.widgets.leadsSummary, component: W.LeadsSummaryWidget, defaultSize: { w: 3, h: 2 }, category: 'kpi' },
  monthlyConversions: { type: 'monthlyConversions', name: he.widgets.monthlyConversions, component: W.MonthlyConversionsWidget, defaultSize: { w: 3, h: 2 }, category: 'kpi' },
  paymentsThisMonth: { type: 'paymentsThisMonth', name: he.widgets.paymentsThisMonth, component: W.PaymentsThisMonthWidget, defaultSize: { w: 3, h: 2 }, category: 'kpi' },
  pipelineBudget: { type: 'pipelineBudget', name: he.widgets.pipelineBudget, component: W.PipelineBudgetWidget, defaultSize: { w: 3, h: 2 }, category: 'kpi' },
  newCustomers: { type: 'newCustomers', name: he.widgets.newCustomers, component: W.NewCustomersWidget, defaultSize: { w: 3, h: 2 }, category: 'kpi' },
  conversionRate: { type: 'conversionRate', name: he.widgets.conversionRate, component: W.ConversionRateWidget, defaultSize: { w: 3, h: 2 }, category: 'kpi' },
  activeProjectsKpi: { type: 'activeProjectsKpi', name: he.widgets.activeProjects, component: W.ActiveProjectsKpiWidget, defaultSize: { w: 3, h: 2 }, category: 'kpi' },
  pendingQuotes: { type: 'pendingQuotes', name: he.widgets.pendingQuotes, component: W.PendingQuotesWidget, defaultSize: { w: 6, h: 4 }, category: 'lists' },
  todayTasks: { type: 'todayTasks', name: he.widgets.todayTasks, component: W.TodayTasksWidget, defaultSize: { w: 6, h: 4 }, category: 'lists' },
  overdueTasks: { type: 'overdueTasks', name: he.widgets.overdueTasks, component: W.OverdueTasksWidget, defaultSize: { w: 6, h: 4 }, category: 'lists' },
  activeProjects: { type: 'activeProjects', name: he.widgets.activeProjects, component: W.ActiveProjectsWidget, defaultSize: { w: 4, h: 4 }, category: 'lists' },
  overduePayments: { type: 'overduePayments', name: he.widgets.overduePayments, component: W.OverduePaymentsWidget, defaultSize: { w: 6, h: 4 }, category: 'lists' },
  revenueChart: { type: 'revenueChart', name: he.widgets.revenueChart, component: W.RevenueChartWidget, defaultSize: { w: 6, h: 4 }, category: 'charts' },
  leadsByCity: { type: 'leadsByCity', name: he.widgets.leadsByCity, component: W.LeadsByCityWidget, defaultSize: { w: 4, h: 4 }, category: 'charts' },
  leadsByType: { type: 'leadsByType', name: he.widgets.leadsByType, component: W.LeadsByTypeWidget, defaultSize: { w: 4, h: 4 }, category: 'charts' },
  salesFunnel: { type: 'salesFunnel', name: he.widgets.salesFunnel, component: W.SalesFunnelWidget, defaultSize: { w: 6, h: 4 }, category: 'charts' },
  miniCalendar: { type: 'miniCalendar', name: he.widgets.miniCalendar, component: W.MiniCalendarWidget, defaultSize: { w: 6, h: 4 }, category: 'calendar' },
};

export const WIDGET_LIST = Object.values(WIDGET_REGISTRY);
