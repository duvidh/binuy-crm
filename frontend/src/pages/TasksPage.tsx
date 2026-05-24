import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, CheckSquare, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { useTasks, useToggleTask, useDeleteTask, type TaskFilter, type Task } from '@/hooks/useTasks';
import { formatDateTime } from '@/lib/format';
import { he } from '@/locales/he';
import type { BadgeProps } from '@/components/ui/badge';

const FILTERS: TaskFilter[] = ['today', 'week', 'overdue', 'all'];
const priorityVariant: Record<string, BadgeProps['variant']> = { LOW: 'secondary', NORMAL: 'default', HIGH: 'warning', URGENT: 'destructive' };

export function TasksPage() {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const { data: tasks, isLoading } = useTasks({ filter });
  const toggle = useToggleTask();
  const del = useDeleteTask();

  const openEdit = (t: Task) => {
    setEditTask(t);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader title={he.tasks.title}>
        <Button onClick={() => { setEditTask(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> {he.tasks.newTask}</Button>
      </PageHeader>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {he.tasks.filters[f]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title={he.tasks.empty} actionLabel={he.tasks.newTask} onAction={() => { setEditTask(null); setFormOpen(true); }} />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const done = t.status === 'COMPLETED';
            const overdue = !done && t.dueDate && new Date(t.dueDate) < new Date();
            return (
              <Card key={t.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <Checkbox checked={done} onCheckedChange={() => toggle.mutate(t.id)} />
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>{t.title}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {t.dueDate && <span className={overdue ? 'text-destructive font-medium' : ''}>{formatDateTime(t.dueDate)}</span>}
                      {t.contact && <span>· {t.contact.fullName}</span>}
                      <span>· {he.tasks.type[t.type as keyof typeof he.tasks.type] ?? t.type}</span>
                    </div>
                  </div>
                  <Badge variant={priorityVariant[t.priority]}>{he.tasks.priority[t.priority]}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => { await del.mutateAsync(t.id); toast.success(he.common.deleted); }}><Trash2 className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editTask} />
    </div>
  );
}
