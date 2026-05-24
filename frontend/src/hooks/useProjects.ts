import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Project, Paginated } from '@/types';

export function useProjects(query: { page?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['projects', query],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v && v !== 'all'));
      return (await api.get<Paginated<Project>>('/projects', { params: { pageSize: 25, ...params } })).data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useProjectsKanban() {
  return useQuery({
    queryKey: ['projects', 'kanban'],
    queryFn: async () => (await api.get<Project[]>('/projects/kanban')).data,
  });
}

export function useProject(id?: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get<Project>(`/projects/${id}`)).data,
    enabled: !!id,
  });
}

export function useChecklistTemplates() {
  return useQuery({
    queryKey: ['checklist-templates'],
    queryFn: async () => (await api.get<{ id: string; name: string; projectType?: string; items: string[] }[]>('/projects/checklist-templates')).data,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: ['projects'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  if (id) qc.invalidateQueries({ queryKey: ['project', id] });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Project>) => (await api.post<Project>('/projects', data)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Project>) => (await api.patch<Project>(`/projects/${id}`, data)).data,
    onSuccess: (_d, v) => invalidate(qc, v.id),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/projects/${id}`)).data,
    onSuccess: () => invalidate(qc),
  });
}

// Generic sub-resource mutation helper.
export function useProjectMutation(projectId: string) {
  const qc = useQueryClient();
  const refresh = () => invalidate(qc, projectId);
  return {
    addMilestone: useMutation({ mutationFn: async (d: Record<string, unknown>) => (await api.post(`/projects/${projectId}/milestones`, d)).data, onSuccess: refresh }),
    updateMilestone: useMutation({ mutationFn: async ({ id, ...d }: { id: string } & Record<string, unknown>) => (await api.patch(`/projects/${projectId}/milestones/${id}`, d)).data, onSuccess: refresh }),
    deleteMilestone: useMutation({ mutationFn: async (id: string) => (await api.delete(`/projects/${projectId}/milestones/${id}`)).data, onSuccess: refresh }),
    addPermit: useMutation({ mutationFn: async (d: Record<string, unknown>) => (await api.post(`/projects/${projectId}/permits`, d)).data, onSuccess: refresh }),
    deletePermit: useMutation({ mutationFn: async (id: string) => (await api.delete(`/projects/${projectId}/permits/${id}`)).data, onSuccess: refresh }),
    addChecklist: useMutation({ mutationFn: async (d: Record<string, unknown>) => (await api.post(`/projects/${projectId}/checklists`, d)).data, onSuccess: refresh }),
    toggleItem: useMutation({ mutationFn: async (itemId: string) => (await api.patch(`/projects/${projectId}/checklist-items/${itemId}`)).data, onSuccess: refresh }),
    addSiteLog: useMutation({ mutationFn: async (d: Record<string, unknown>) => (await api.post(`/projects/${projectId}/site-log`, d)).data, onSuccess: refresh }),
    uploadPhoto: useMutation({ mutationFn: async (form: FormData) => (await api.post(`/projects/${projectId}/photos`, form)).data, onSuccess: refresh }),
    deletePhoto: useMutation({ mutationFn: async (id: string) => (await api.delete(`/projects/${projectId}/photos/${id}`)).data, onSuccess: refresh }),
  };
}
