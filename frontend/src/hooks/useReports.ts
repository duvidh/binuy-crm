import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Range {
  from?: string;
  to?: string;
}

export function useSalesReport(range: Range) {
  return useQuery({
    queryKey: ['reports', 'sales', range],
    queryFn: async () => (await api.get<{ totalQuotes: number; wonQuotes: number; totalValue: number; wonValue: number; winRate: number; series: { month: string; quoted: number; won: number }[] }>('/reports/sales', { params: range })).data,
  });
}

export function useLeadSourcesReport(range: Range) {
  return useQuery({
    queryKey: ['reports', 'lead-sources', range],
    queryFn: async () => (await api.get<{ source: string; count: number; converted: number; value: number; conversionRate: number }[]>('/reports/lead-sources', { params: range })).data,
  });
}

export function useProfitabilityReport() {
  return useQuery({
    queryKey: ['reports', 'profitability'],
    queryFn: async () => (await api.get<{ id: string; name: string; revenue: number; expenses: number; profit: number; margin: number }[]>('/reports/profitability')).data,
  });
}

export function useSalesByRepReport(range: Range) {
  return useQuery({
    queryKey: ['reports', 'sales-by-rep', range],
    queryFn: async () => (await api.get<{ id: string; name: string; leads: number; customers: number; conversionRate: number }[]>('/reports/sales-by-rep', { params: range })).data,
  });
}
