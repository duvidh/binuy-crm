import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DashboardStats {
  kpis: {
    leadsNew: number;
    leadsHot: number;
    leadsCold: number;
    customersThisMonth: number;
    convertedThisMonth: number;
    conversionRate: number;
    activeProjects: number;
    paidThisMonth: number;
    pipelineBudget: number;
    monthlyConversionRate: number;
  };
  pendingQuotes: { id: string; quoteNumber: string; total: number; contact?: { fullName: string } }[];
  overduePayments: { id: string; amount: number }[];
  openTasks: { id: string; title: string; dueDate?: string; contact?: { fullName: string } }[];
  overdueTasks: { id: string; title: string; dueDate?: string; contact?: { fullName: string } }[];
  activeProjectsList: { id: string; name: string; status: string; progress: number; contact?: { fullName: string } }[];
  leadsByCity: { name: string; value: number }[];
  leadsByType: { name: string; value: number }[];
}

export interface WidgetInstance {
  i: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => (await api.get<DashboardStats>('/dashboard/stats')).data,
    staleTime: 30_000,
  });
}

export function useRevenueSeries(months = 6) {
  return useQuery({
    queryKey: ['dashboard', 'revenue', months],
    queryFn: async () => (await api.get<{ month: string; value: number }[]>('/dashboard/revenue', { params: { months } })).data,
    staleTime: 60_000,
  });
}

export function useDashboardLayout() {
  return useQuery({
    queryKey: ['dashboard', 'layout'],
    queryFn: async () => (await api.get<{ widgets: WidgetInstance[] }>('/dashboard/layout')).data,
  });
}

export function useSaveLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (widgets: WidgetInstance[]) => (await api.put('/dashboard/layout', { widgets })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'layout'] }),
  });
}
