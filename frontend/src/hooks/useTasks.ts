import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type TaskFilter = 'today' | 'week' | 'overdue' | 'all';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  endDate?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  contactId?: string | null;
  contact?: { id: string; fullName: string } | null;
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  color?: string | null;
}

export function useTasks(query: { filter?: TaskFilter; from?: string; to?: string; assignedToId?: string } = {}) {
  return useQuery({
    queryKey: ['tasks', query],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v && v !== 'all'));
      return (await api.get<Task[]>('/tasks', { params })).data;
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['tasks'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (d: Partial<Task>) => (await api.post('/tasks', d)).data, onSuccess: () => invalidate(qc) });
}
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...d }: { id: string } & Partial<Task>) => (await api.patch(`/tasks/${id}`, d)).data, onSuccess: () => invalidate(qc) });
}
export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => (await api.patch(`/tasks/${id}/toggle`)).data, onSuccess: () => invalidate(qc) });
}
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => (await api.delete(`/tasks/${id}`)).data, onSuccess: () => invalidate(qc) });
}
