import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Pencil, Plus, Trash2, Upload, AlertTriangle, Check } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { useProject, useProjectMutation, useChecklistTemplates } from '@/hooks/useProjects';
import { usePayments, useCreatePayment, useExpenses, useCreateExpense, useSuppliers } from '@/hooks/useFinance';
import { useListValues } from '@/hooks/useSettings';
import { formatCurrency, formatDate } from '@/lib/format';
import { projectStatusLabel, projectStatusVariant, paymentStatusVariant } from '@/lib/contactMeta';
import { he } from '@/locales/he';

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || !project) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  const p = project;
  const prof = p.profitability;

  return (
    <div>
      <PageHeader title={p.name}>
        <Button variant="ghost" onClick={() => navigate('/projects')}><ArrowRight className="h-4 w-4" /> {he.common.back}</Button>
        <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> {he.common.edit}</Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant={projectStatusVariant[p.status]}>{projectStatusLabel(p.status)}</Badge>
        <span className="text-sm text-muted-foreground">{p.contact?.fullName}{p.city ? ` · ${p.city}` : ''}</span>
      </div>

      {prof && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={he.projects.profitability.revenue} value={formatCurrency(prof.revenue)} tone="success" />
          <Stat label={he.projects.profitability.expenses} value={formatCurrency(prof.expenses)} tone={prof.overBudget ? 'danger' : 'default'} />
          <Stat label={he.projects.profitability.profit} value={formatCurrency(prof.profit)} tone={prof.profit >= 0 ? 'success' : 'danger'} />
          <Stat label={he.projects.profitability.margin} value={`${prof.margin}%`} />
          {prof.overBudget && (
            <div className="col-span-2 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-4">
              <AlertTriangle className="h-4 w-4" /> {he.projects.profitability.overBudget}
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">{he.projects.tabs.overview}</TabsTrigger>
          <TabsTrigger value="milestones">{he.projects.tabs.milestones}</TabsTrigger>
          <TabsTrigger value="permits">{he.projects.tabs.permits}</TabsTrigger>
          <TabsTrigger value="checklists">{he.projects.tabs.checklists}</TabsTrigger>
          <TabsTrigger value="payments">{he.projects.tabs.payments}</TabsTrigger>
          <TabsTrigger value="expenses">{he.projects.tabs.expenses}</TabsTrigger>
          <TabsTrigger value="photos">{he.projects.tabs.photos}</TabsTrigger>
          <TabsTrigger value="siteLog">{he.projects.tabs.siteLog}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab project={p} /></TabsContent>
        <TabsContent value="milestones"><MilestonesTab projectId={p.id} /></TabsContent>
        <TabsContent value="permits"><PermitsTab projectId={p.id} /></TabsContent>
        <TabsContent value="checklists"><ChecklistsTab projectId={p.id} projectType={p.projectType} /></TabsContent>
        <TabsContent value="payments"><PaymentsTab projectId={p.id} contactId={p.contactId} /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab projectId={p.id} /></TabsContent>
        <TabsContent value="photos"><PhotosTab projectId={p.id} /></TabsContent>
        <TabsContent value="siteLog"><SiteLogTab projectId={p.id} /></TabsContent>
      </Tabs>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={p} />
    </div>
  );
}

function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'danger' }) {
  const color = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-destructive' : 'text-foreground';
  return (
    <Card><CardContent className="pt-5"><div className="text-xs text-muted-foreground">{label}</div><div className={`mt-1 text-xl font-bold ${color}`} dir="ltr">{value}</div></CardContent></Card>
  );
}

function OverviewTab({ project }: { project: ReturnType<typeof useProject>['data'] & object }) {
  const f = he.projects.fields;
  const rows: [string, string | undefined][] = [
    [f.budget, project.budget != null ? formatCurrency(project.budget) : undefined],
    [f.budgetUsed, formatCurrency(project.budgetUsed)],
    [f.manager, project.manager?.name],
    [f.projectType, project.projectType ?? undefined],
    [f.address, project.address ?? undefined],
    [f.startDatePlanned, project.startDatePlanned ? formatDate(project.startDatePlanned) : undefined],
    [f.endDatePlanned, project.endDatePlanned ? formatDate(project.endDatePlanned) : undefined],
  ];
  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}><div className="text-sm text-muted-foreground">{label}</div><div className="mt-0.5 font-medium">{value || '—'}</div></div>
        ))}
        {project.notes && <div className="sm:col-span-2"><div className="text-sm text-muted-foreground">{f.notes}</div><p className="mt-1 whitespace-pre-wrap">{project.notes}</p></div>}
      </CardContent>
    </Card>
  );
}

function MilestonesTab({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const m = useProjectMutation(projectId);
  const { data: units } = { data: [] as string[] };
  void units;
  const [name, setName] = useState('');
  const [planned, setPlanned] = useState('');
  const milestones = project?.milestones ?? [];

  const add = async () => {
    if (!name.trim()) return;
    await m.addMilestone.mutateAsync({ name, plannedDate: planned || null });
    setName(''); setPlanned('');
    toast.success(he.common.saved);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[160px]"><Label>{he.projects.milestones.name}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>{he.projects.milestones.plannedDate}</Label><Input type="date" dir="ltr" value={planned} onChange={(e) => setPlanned(e.target.value)} /></div>
          <Button onClick={add}><Plus className="h-4 w-4" /> {he.projects.milestones.add}</Button>
        </div>
        {milestones.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{he.common.noResults}</p> : (
          <div className="space-y-3">
            {milestones.map((ms) => (
              <div key={ms.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{ms.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{ms.plannedDate ? formatDate(ms.plannedDate) : ''}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => m.deleteMilestone.mutate(ms.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary" style={{ width: `${ms.progressPct}%` }} /></div>
                  <Input type="number" dir="ltr" className="h-7 w-16" value={ms.progressPct} onChange={(e) => m.updateMilestone.mutate({ id: ms.id, progressPct: Number(e.target.value) })} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PermitsTab({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const m = useProjectMutation(projectId);
  const [form, setForm] = useState<Record<string, string>>({ status: 'PENDING' });
  const permits = project?.permits ?? [];
  const soon = (d?: string | null) => d && new Date(d).getTime() - Date.now() < 30 * 86400000 && new Date(d).getTime() > Date.now();

  const add = async () => {
    await m.addPermit.mutateAsync({ ...form, expiryDate: form.expiryDate || null });
    setForm({ status: 'PENDING' });
    toast.success(he.common.saved);
  };

  const st = he.projects.permits.statuses;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div><Label>{he.projects.permits.fileNumber}</Label><Input value={form.fileNumber ?? ''} onChange={(e) => setForm((f) => ({ ...f, fileNumber: e.target.value }))} /></div>
          <div><Label>{he.projects.permits.gush}</Label><Input value={form.gush ?? ''} onChange={(e) => setForm((f) => ({ ...f, gush: e.target.value }))} /></div>
          <div><Label>{he.projects.permits.helka}</Label><Input value={form.helka ?? ''} onChange={(e) => setForm((f) => ({ ...f, helka: e.target.value }))} /></div>
          <div><Label>{he.projects.permits.expiryDate}</Label><Input type="date" dir="ltr" value={form.expiryDate ?? ''} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} /></div>
          <div className="flex items-end"><Button onClick={add} className="w-full"><Plus className="h-4 w-4" /> {he.projects.permits.add}</Button></div>
        </div>
        {permits.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{he.common.noResults}</p> : (
          <div className="space-y-2">
            {permits.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">תיק {pm.fileNumber || '—'} {pm.gush && `· גוש ${pm.gush}`} {pm.helka && `חלקה ${pm.helka}`}</div>
                  {pm.expiryDate && <div className={`text-xs ${soon(pm.expiryDate) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{he.projects.permits.expiryDate}: {formatDate(pm.expiryDate)} {soon(pm.expiryDate) && `· ${he.projects.permits.expiringSoon}`}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{st[pm.status as keyof typeof st] ?? pm.status}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => m.deletePermit.mutate(pm.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChecklistsTab({ projectId, projectType }: { projectId: string; projectType?: string | null }) {
  const { data: project } = useProject(projectId);
  const { data: templates } = useChecklistTemplates();
  const m = useProjectMutation(projectId);
  const checklists = project?.checklists ?? [];
  const relevant = templates?.filter((t) => !projectType || t.projectType === projectType) ?? templates ?? [];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {relevant.map((t) => (
            <Button key={t.id} variant="outline" size="sm" onClick={() => m.addChecklist.mutate({ templateId: t.id, name: t.name })}>
              <Plus className="h-4 w-4" /> {t.name}
            </Button>
          ))}
        </div>
        {checklists.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{he.common.noResults}</p> : (
          <div className="space-y-4">
            {checklists.map((cl) => {
              const done = cl.items.filter((i) => i.completed).length;
              return (
                <div key={cl.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between"><span className="font-semibold">{cl.name}</span><Badge variant="secondary">{done}/{cl.items.length}</Badge></div>
                  <ul className="space-y-1.5">
                    {cl.items.map((it) => (
                      <li key={it.id} className="flex items-center gap-2">
                        <Checkbox checked={it.completed} onCheckedChange={() => m.toggleItem.mutate(it.id)} />
                        <span className={it.completed ? 'text-muted-foreground line-through' : ''}>{it.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentsTab({ projectId, contactId }: { projectId: string; contactId: string }) {
  const { data } = usePayments({ projectId });
  const create = useCreatePayment();
  const methods = useListValues('paymentMethod');
  const [form, setForm] = useState<Record<string, string>>({ status: 'PENDING' });

  const add = async () => {
    if (!form.amount) return;
    await create.mutateAsync({ projectId, contactId, amount: Number(form.amount), status: form.status as never, method: form.method || null, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null });
    setForm({ status: 'PENDING' });
    toast.success(he.common.saved);
  };
  const payments = data?.data ?? [];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div><Label>{he.finance.amount}</Label><Input type="number" dir="ltr" value={form.amount ?? ''} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></div>
          <div>
            <Label>{he.finance.status}</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(['PAID', 'PENDING', 'OVERDUE'] as const).map((s) => <SelectItem key={s} value={s}>{he.finance.paymentStatus[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{he.finance.method}</Label>
            <Select value={form.method || ''} onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{methods.map((mm) => <SelectItem key={mm} value={mm}>{mm}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{he.finance.dueDate}</Label><Input type="date" dir="ltr" value={form.dueDate ?? ''} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></div>
          <div className="flex items-end"><Button onClick={add} className="w-full"><Plus className="h-4 w-4" /> {he.common.add}</Button></div>
        </div>
        {payments.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{he.finance.emptyPayments}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{he.finance.amount}</TableHead><TableHead>{he.finance.method}</TableHead><TableHead>{he.finance.dueDate}</TableHead><TableHead>{he.finance.status}</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.map((pay) => (
                <TableRow key={pay.id}>
                  <TableCell className="font-medium">{formatCurrency(pay.amount)}</TableCell>
                  <TableCell>{pay.method ?? '—'}</TableCell>
                  <TableCell>{pay.dueDate ? formatDate(pay.dueDate) : '—'}</TableCell>
                  <TableCell><Badge variant={paymentStatusVariant[pay.status]}>{he.finance.paymentStatus[pay.status]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ExpensesTab({ projectId }: { projectId: string }) {
  const { data: expenses } = useExpenses({ projectId });
  const create = useCreateExpense();
  const { data: suppliers } = useSuppliers();
  const categories = useListValues('expenseCategory');
  const [form, setForm] = useState<Record<string, string>>({});

  const add = async () => {
    if (!form.amount) return;
    await create.mutateAsync({ projectId, amount: Number(form.amount), category: form.category || null, supplierId: form.supplierId || null, description: form.description || null });
    setForm({});
    toast.success(he.common.saved);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div><Label>{he.finance.amount}</Label><Input type="number" dir="ltr" value={form.amount ?? ''} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></div>
          <div>
            <Label>{he.finance.category}</Label>
            <Select value={form.category || ''} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{he.finance.suppliers}</Label>
            <Select value={form.supplierId || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent><SelectItem value="none">{he.common.none}</SelectItem>{suppliers?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{he.finance.description}</Label><Input value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex items-end"><Button onClick={add} className="w-full"><Plus className="h-4 w-4" /> {he.common.add}</Button></div>
        </div>
        {!expenses || expenses.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{he.finance.emptyExpenses}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{he.finance.amount}</TableHead><TableHead>{he.finance.category}</TableHead><TableHead>{he.finance.suppliers}</TableHead><TableHead>{he.finance.date}</TableHead></TableRow></TableHeader>
            <TableBody>
              {expenses.map((ex) => (
                <TableRow key={ex.id}>
                  <TableCell className="font-medium">{formatCurrency(ex.amount)}</TableCell>
                  <TableCell>{ex.category ?? '—'}</TableCell>
                  <TableCell>{ex.supplier?.name ?? '—'}</TableCell>
                  <TableCell>{formatDate(ex.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function PhotosTab({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const m = useProjectMutation(projectId);
  const [phase, setPhase] = useState('during');
  const photos = project?.photos ?? [];

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('phase', phase);
    await m.uploadPhoto.mutateAsync(form);
    toast.success(he.common.saved);
    e.target.value = '';
  };

  const phaseLabel: Record<string, string> = { before: he.projects.photos.before, during: he.projects.photos.during, after: he.projects.photos.after };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-end gap-2">
          <div className="w-40">
            <Label>{he.projects.photos.phase}</Label>
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(phaseLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button asChild variant="outline">
            <label className="cursor-pointer"><Upload className="h-4 w-4" /> {he.projects.photos.upload}<input type="file" accept="image/*" className="hidden" onChange={onFile} /></label>
          </Button>
        </div>
        {photos.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{he.common.noResults}</p> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((ph) => (
              <div key={ph.id} className="group relative overflow-hidden rounded-lg border">
                <img src={ph.filePath} alt={ph.caption ?? ''} className="h-36 w-full object-cover" />
                <div className="absolute top-1 start-1"><Badge variant="secondary">{phaseLabel[ph.phase ?? 'during']}</Badge></div>
                <button onClick={() => m.deletePhoto.mutate(ph.id)} className="absolute top-1 end-1 rounded bg-destructive/80 p-1 text-white opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SiteLogTab({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const m = useProjectMutation(projectId);
  const [form, setForm] = useState<Record<string, string>>({});
  const logs = project?.siteLogs ?? [];

  const add = async () => {
    if (!form.workDone?.trim()) return;
    await m.addSiteLog.mutateAsync({ workersCount: Number(form.workersCount) || 0, workDone: form.workDone, date: form.date ? new Date(form.date).toISOString() : undefined });
    setForm({});
    toast.success(he.common.saved);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <div><Label>{he.projects.siteLog.date}</Label><Input type="date" dir="ltr" value={form.date ?? ''} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
          <div><Label>{he.projects.siteLog.workers}</Label><Input type="number" dir="ltr" value={form.workersCount ?? ''} onChange={(e) => setForm((f) => ({ ...f, workersCount: e.target.value }))} /></div>
          <div className="sm:col-span-2 flex items-end gap-2">
            <div className="flex-1"><Label>{he.projects.siteLog.workDone}</Label><Input value={form.workDone ?? ''} onChange={(e) => setForm((f) => ({ ...f, workDone: e.target.value }))} /></div>
            <Button onClick={add}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        {logs.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{he.common.noResults}</p> : (
          <ul className="space-y-2">
            {logs.map((l) => (
              <li key={l.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm"><span className="font-medium">{formatDate(l.date)}</span><span className="text-muted-foreground">{l.workersCount} עובדים</span></div>
                {l.workDone && <p className="mt-1 text-sm">{l.workDone}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
