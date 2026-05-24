import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Payment, Supplier, Expense, Paginated } from '@/types';

export function usePayments(query: { projectId?: string; contactId?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ['payments', query],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v && v !== 'all'));
      return (await api.get<Paginated<Payment>>('/finance/payments', { params: { pageSize: 100, ...params } })).data;
    },
  });
}

export function useAging() {
  return useQuery({
    queryKey: ['payments', 'aging'],
    queryFn: async () => (await api.get<{ buckets: Record<string, number>; rows: { id: string; contact?: string; project?: string; amount: number; days: number; bucket: string }[] }>('/finance/payments/aging')).data,
  });
}

export function useCashflow(days = 90) {
  return useQuery({
    queryKey: ['payments', 'cashflow', days],
    queryFn: async () => (await api.get<{ horizon: number; incomeTotal: number; expenseTotal: number; net: number }>('/finance/payments/cashflow', { params: { days } })).data,
  });
}

function invalidatePayments(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['payments'] });
  qc.invalidateQueries({ queryKey: ['project'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (d: Partial<Payment>) => (await api.post('/finance/payments', d)).data, onSuccess: () => invalidatePayments(qc) });
}
export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...d }: { id: string } & Partial<Payment>) => (await api.patch(`/finance/payments/${id}`, d)).data, onSuccess: () => invalidatePayments(qc) });
}
export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => (await api.delete(`/finance/payments/${id}`)).data, onSuccess: () => invalidatePayments(qc) });
}

export function useSuppliers() {
  return useQuery({ queryKey: ['suppliers'], queryFn: async () => (await api.get<Supplier[]>('/finance/suppliers')).data });
}
export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (d: Partial<Supplier>) => (await api.post('/finance/suppliers', d)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }) });
}
export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => (await api.delete(`/finance/suppliers/${id}`)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }) });
}

export function useExpenses(query: { projectId?: string } = {}) {
  return useQuery({
    queryKey: ['expenses', query],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v));
      return (await api.get<Expense[]>('/finance/expenses', { params })).data;
    },
  });
}
export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Partial<Expense>) => (await api.post('/finance/expenses', d)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['project'] });
    },
  });
}
export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/finance/expenses/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['project'] });
    },
  });
}
