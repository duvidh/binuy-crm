import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Contact, Paginated } from '@/types';

export interface ContactQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: string;
  city?: string;
  projectType?: string;
  leadType?: string;
  status?: string;
  source?: string;
  assignedToId?: string;
  tagId?: string;
}

export function useContacts(query: ContactQuery) {
  return useQuery({
    queryKey: ['contacts', query],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'),
      );
      return (await api.get<Paginated<Contact>>('/contacts', { params })).data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useContactsKanban() {
  return useQuery({
    queryKey: ['contacts', 'kanban'],
    queryFn: async () => (await api.get<Contact[]>('/contacts/kanban')).data,
  });
}

export function useContact(id?: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => (await api.get<Contact>(`/contacts/${id}`)).data,
    enabled: !!id,
  });
}

export function useContactActivity(id?: string) {
  return useQuery({
    queryKey: ['contact', id, 'activity'],
    queryFn: async () => (await api.get(`/contacts/${id}/activity`)).data,
    enabled: !!id,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['contacts'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Contact>) => (await api.post('/contacts', data)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Contact>) =>
      (await api.patch(`/contacts/${id}`, data)).data,
    onSuccess: (_d, vars) => {
      invalidate(qc);
      qc.invalidateQueries({ queryKey: ['contact', vars.id] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/contacts/${id}`)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useConvertContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/contacts/${id}/convert`)).data,
    onSuccess: (_d, id) => {
      invalidate(qc);
      qc.invalidateQueries({ queryKey: ['contact', id] });
    },
  });
}

export function useBulkContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ids: string[]; action: string; value?: string }) =>
      (await api.post('/contacts/bulk', payload)).data,
    onSuccess: () => invalidate(qc),
  });
}
