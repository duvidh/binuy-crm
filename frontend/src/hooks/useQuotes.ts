import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Quote, Paginated, PriceCatalogItem } from '@/types';

export function useQuotes(query: { page?: number; search?: string; status?: string; contactId?: string }) {
  return useQuery({
    queryKey: ['quotes', query],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v && v !== 'all'));
      return (await api.get<Paginated<Quote>>('/quotes', { params: { pageSize: 25, ...params } })).data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useQuote(id?: string) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: async () => (await api.get<Quote>(`/quotes/${id}`)).data,
    enabled: !!id && id !== 'new',
  });
}

export function usePriceCatalog() {
  return useQuery({
    queryKey: ['quotes', 'catalog'],
    queryFn: async () => (await api.get<PriceCatalogItem[]>('/quotes/catalog')).data,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['quotes'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Quote>) => (await api.post<Quote>('/quotes', data)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Quote>) =>
      (await api.patch<Quote>(`/quotes/${id}`, data)).data,
    onSuccess: (_d, vars) => {
      invalidate(qc);
      qc.invalidateQueries({ queryKey: ['quote', vars.id] });
    },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/quotes/${id}`)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useDuplicateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Quote>(`/quotes/${id}/duplicate`)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useSendQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<{ token: string; signUrl: string }>(`/quotes/${id}/send`)).data,
    onSuccess: (_d, id) => {
      invalidate(qc);
      qc.invalidateQueries({ queryKey: ['quote', id] });
    },
  });
}
