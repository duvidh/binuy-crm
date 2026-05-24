import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTask, useUpdateTask, type Task } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useContacts } from '@/hooks/useContacts';
import { apiErrorMessage } from '@/lib/api';
import { he } from '@/locales/he';

const TYPES = ['TASK', 'MEETING', 'CALL', 'SITE_VISIT', 'REMINDER'] as const;
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

export function TaskFormDialog({ open, onOpenChange, task, defaultDate }: { open: boolean; onOpenChange: (o: boolean) => void; task?: Task | null; defaultDate?: string }) {
  const isEdit = !!task;
  const create = useCreateTask();
  const update = useUpdateTask();
  const { data: users } = useUsers();
  const { data: contacts } = useContacts({ pageSize: 100, sortBy: 'fullName', sortDir: 'asc' });
  const [form, setForm] = useState<Record<string, string>>({ type: 'TASK', priority: 'NORMAL' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm(
        task
          ? {
              title: task.title,
              description: task.description ?? '',
              dueDate: task.dueDate ? task.dueDate.slice(0, 16) : '',
              type: task.type,
              priority: task.priority,
              assignedToId: task.assignedToId ?? '',
              contactId: task.contactId ?? '',
            }
          : { type: 'TASK', priority: 'NORMAL', dueDate: defaultDate ?? '' },
      );
    }
  }, [open, task, defaultDate]);

  const submit = async () => {
    if (!form.title?.trim()) {
      toast.error(he.common.required);
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      type: form.type,
      priority: form.priority as Task['priority'],
      assignedToId: form.assignedToId || null,
      contactId: form.contactId || null,
    };
    try {
      if (isEdit) await update.mutateAsync({ id: task!.id, ...payload });
      else await create.mutateAsync(payload);
      toast.success(he.common.saved);
      onOpenChange(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const f = he.tasks.fields;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? he.tasks.editTask : he.tasks.newTask}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>{f.title} *</Label><Input value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} /></div>
          <div><Label>{f.dueDate}</Label><Input type="datetime-local" dir="ltr" value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value)} /></div>
          <div>
            <Label>{f.type}</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{he.tasks.type[t]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{f.priority}</Label>
            <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{he.tasks.priority[p]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{f.assignedTo}</Label>
            <Select value={form.assignedToId || 'none'} onValueChange={(v) => set('assignedToId', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder={he.common.none} /></SelectTrigger>
              <SelectContent><SelectItem value="none">{he.common.none}</SelectItem>{users?.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{f.contact}</Label>
            <Select value={form.contactId || 'none'} onValueChange={(v) => set('contactId', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder={he.common.none} /></SelectTrigger>
              <SelectContent><SelectItem value="none">{he.common.none}</SelectItem>{contacts?.data.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2"><Label>{f.description}</Label><Textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>{he.common.save}</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{he.common.cancel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
