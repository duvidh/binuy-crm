import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MessageTemplate {
  id: string;
  channel: string;
  name: string;
  body: string;
  variables?: string | null;
}

export function useTemplates() {
  return useQuery({ queryKey: ['templates'], queryFn: async () => (await api.get<MessageTemplate[]>('/admin/templates')).data });
}
export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (d: { channel: string; name: string; body: string }) => (await api.post('/admin/templates', d)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }) });
}
export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => (await api.delete(`/admin/templates/${id}`)).data, onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }) });
}

export interface AuditEntry {
  id: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  createdAt: string;
  user?: { name: string } | null;
}
export function useAuditLog(filters: { entityType?: string; action?: string } = {}) {
  return useQuery({
    queryKey: ['audit-log', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all'));
      return (await api.get<AuditEntry[]>('/admin/audit-log', { params })).data;
    },
  });
}

interface TrashItem { id: string; label: string; deletedAt: string; type: string }
export function useTrash() {
  return useQuery({ queryKey: ['trash'], queryFn: async () => (await api.get<{ contacts: TrashItem[]; projects: TrashItem[]; quotes: TrashItem[] }>('/admin/trash')).data });
}
export function useRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => (await api.post(`/admin/trash/${type}/${id}/restore`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}
