import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AutomationRule {
  id: string;
  name: string;
  triggerType: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>[];
  isActive: boolean;
  _count?: { executions: number };
}

export function useAutomations() {
  return useQuery({ queryKey: ['automations'], queryFn: async () => (await api.get<AutomationRule[]>('/automations')).data });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: { name: string; triggerType: string; conditions?: Record<string, unknown>; actions?: Record<string, unknown>[]; isActive?: boolean }) =>
      (await api.post('/automations', d)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...d }: { id: string } & Record<string, unknown>) => (await api.patch(`/automations/${id}`, d)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/automations/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}
