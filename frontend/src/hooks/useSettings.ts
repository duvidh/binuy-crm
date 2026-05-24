import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SettingsListItem, PipelineStage, CompanySettings } from '@/types';

interface ListsResponse {
  items: SettingsListItem[];
  grouped: Record<string, SettingsListItem[]>;
}

export function useLists() {
  return useQuery({
    queryKey: ['settings', 'lists'],
    queryFn: async () => (await api.get<ListsResponse>('/settings/lists')).data,
    staleTime: 60_000,
  });
}

// Convenience: values array for a single list type.
export function useListValues(listType: string): string[] {
  const { data } = useLists();
  return (data?.grouped[listType] ?? []).map((i) => i.value);
}

export function useAddListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { listType: string; value: string; color?: string }) =>
      (await api.post('/settings/lists', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'lists'] }),
  });
}

export function useUpdateListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; value?: string; color?: string }) =>
      (await api.patch(`/settings/lists/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'lists'] }),
  });
}

export function useDeleteListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/settings/lists/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'lists'] }),
  });
}

export function usePipelineStages() {
  return useQuery({
    queryKey: ['settings', 'pipeline'],
    queryFn: async () => (await api.get<PipelineStage[]>('/settings/pipeline-stages')).data,
    staleTime: 60_000,
  });
}

function invalidatePipeline(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['settings', 'pipeline'] });
}

export function useCreateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; color?: string }) =>
      (await api.post('/settings/pipeline-stages', input)).data,
    onSuccess: () => invalidatePipeline(qc),
  });
}

export function useUpdateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; color?: string }) =>
      (await api.patch(`/settings/pipeline-stages/${id}`, data)).data,
    onSuccess: () => invalidatePipeline(qc),
  });
}

export function useDeleteStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/settings/pipeline-stages/${id}`)).data,
    onSuccess: () => invalidatePipeline(qc),
  });
}

export function useReorderStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => (await api.patch('/settings/pipeline-stages/reorder', { ids })).data,
    onSuccess: () => invalidatePipeline(qc),
  });
}

export function useCompany() {
  return useQuery({
    queryKey: ['settings', 'company'],
    queryFn: async () => (await api.get<CompanySettings>('/settings/company')).data,
    staleTime: 60_000,
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CompanySettings>) =>
      (await api.put('/settings/company', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'company'] }),
  });
}
