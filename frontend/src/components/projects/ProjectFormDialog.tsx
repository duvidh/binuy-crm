import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/common/Combobox';
import { useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { useContacts } from '@/hooks/useContacts';
import { useUsers } from '@/hooks/useUsers';
import { useListValues, useAddListItem } from '@/hooks/useSettings';
import { apiErrorMessage } from '@/lib/api';
import { he } from '@/locales/he';
import type { Project, ProjectStatus } from '@/types';

const STATUSES: ProjectStatus[] = ['PLANNING', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

export function ProjectFormDialog({ open, onOpenChange, project }: { open: boolean; onOpenChange: (o: boolean) => void; project?: Project | null }) {
  const isEdit = !!project;
  const create = useCreateProject();
  const update = useUpdateProject();
  const { data: contacts } = useContacts({ pageSize: 100, sortBy: 'fullName', sortDir: 'asc' });
  const { data: users } = useUsers();
  const cities = useListValues('city');
  const projectTypes = useListValues('projectType');
  const addListItem = useAddListItem();

  const [form, setForm] = useState<Record<string, unknown>>({ status: 'PLANNING', progress: 0 });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm(
        project
          ? {
              name: project.name,
              contactId: project.contactId,
              address: project.address ?? '',
              city: project.city ?? '',
              projectType: project.projectType ?? '',
              status: project.status,
              budget: project.budget ?? undefined,
              managerId: project.managerId ?? '',
              progress: project.progress,
              startDatePlanned: project.startDatePlanned?.slice(0, 10) ?? '',
              endDatePlanned: project.endDatePlanned?.slice(0, 10) ?? '',
              notes: project.notes ?? '',
            }
          : { status: 'PLANNING', progress: 0 },
      );
    }
  }, [open, project]);

  const submit = async () => {
    if (!form.name || !form.contactId) {
      toast.error(he.common.required);
      return;
    }
    const payload: Record<string, unknown> = {
      name: form.name,
      contactId: form.contactId,
      address: form.address || null,
      city: form.city || null,
      projectType: form.projectType || null,
      status: form.status,
      budget: form.budget ? Number(form.budget) : null,
      managerId: form.managerId || null,
      progress: Number(form.progress) || 0,
      startDatePlanned: form.startDatePlanned ? new Date(form.startDatePlanned as string).toISOString() : null,
      endDatePlanned: form.endDatePlanned ? new Date(form.endDatePlanned as string).toISOString() : null,
      notes: form.notes || null,
    };
    try {
      if (isEdit) await update.mutateAsync({ id: project!.id, ...payload });
      else await create.mutateAsync(payload);
      toast.success(he.common.saved);
      onOpenChange(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const f = he.projects.fields;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? he.projects.editProject : he.projects.newProject}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>{f.name} *</Label><Input value={String(form.name ?? '')} onChange={(e) => set('name', e.target.value)} /></div>
          <div>
            <Label>{f.contact} *</Label>
            <Select value={String(form.contactId ?? '')} onValueChange={(v) => set('contactId', v)}>
              <SelectTrigger><SelectValue placeholder={f.contact} /></SelectTrigger>
              <SelectContent>{contacts?.data.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{f.status}</Label>
            <Select value={String(form.status ?? 'PLANNING')} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{he.projects.status[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{f.city}</Label>
            <Combobox options={cities} value={String(form.city ?? '')} onChange={(v) => set('city', v)} onAddNew={(v) => addListItem.mutateAsync({ listType: 'city', value: v }).then(() => {})} allowClear />
          </div>
          <div>
            <Label>{f.projectType}</Label>
            <Combobox options={projectTypes} value={String(form.projectType ?? '')} onChange={(v) => set('projectType', v)} onAddNew={(v) => addListItem.mutateAsync({ listType: 'projectType', value: v }).then(() => {})} allowClear />
          </div>
          <div><Label>{f.address}</Label><Input value={String(form.address ?? '')} onChange={(e) => set('address', e.target.value)} /></div>
          <div><Label>{f.budget}</Label><Input type="number" dir="ltr" value={String(form.budget ?? '')} onChange={(e) => set('budget', e.target.value)} /></div>
          <div>
            <Label>{f.manager}</Label>
            <Select value={String(form.managerId || 'none')} onValueChange={(v) => set('managerId', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder={he.common.none} /></SelectTrigger>
              <SelectContent><SelectItem value="none">{he.common.none}</SelectItem>{users?.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{f.startDatePlanned}</Label><Input type="date" dir="ltr" value={String(form.startDatePlanned ?? '')} onChange={(e) => set('startDatePlanned', e.target.value)} /></div>
          <div><Label>{f.endDatePlanned}</Label><Input type="date" dir="ltr" value={String(form.endDatePlanned ?? '')} onChange={(e) => set('endDatePlanned', e.target.value)} /></div>
          <div><Label>{f.progress} (%)</Label><Input type="number" dir="ltr" min={0} max={100} value={String(form.progress ?? 0)} onChange={(e) => set('progress', e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>{f.notes}</Label><Textarea value={String(form.notes ?? '')} onChange={(e) => set('notes', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>{he.common.save}</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{he.common.cancel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
