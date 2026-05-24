import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Building2, ListTree, Users as UsersIcon, GitBranch, Zap, MessageSquare, History, RotateCcw, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useTemplates, useCreateTemplate, useDeleteTemplate, useAuditLog, useTrash, useRestore } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useLists,
  useAddListItem,
  useDeleteListItem,
  usePipelineStages,
  useCompany,
  useUpdateCompany,
} from '@/hooks/useSettings';
import { useUsers, useCreateUser } from '@/hooks/useUsers';
import { useAutomations, useCreateAutomation, useUpdateAutomation, useDeleteAutomation } from '@/hooks/useAutomations';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/stores/auth';
import { apiErrorMessage } from '@/lib/api';
import { he } from '@/locales/he';
import type { UserRole } from '@/types';

const LIST_TYPES = ['city', 'projectType', 'leadSource', 'unit', 'paymentMethod', 'taskType', 'expenseCategory', 'documentCategory'] as const;
const ROLES: UserRole[] = ['ADMIN', 'SALES', 'PROJECT_MANAGER', 'ACCOUNTANT', 'VIEWER'];

export function SettingsPage() {
  const isAdmin = useAuth((s) => s.hasRole('ADMIN'));
  return (
    <div>
      <PageHeader title={he.settings.title} />
      <Tabs defaultValue="lists">
        <TabsList>
          <TabsTrigger value="lists"><ListTree className="h-4 w-4" /> {he.settings.lists}</TabsTrigger>
          <TabsTrigger value="company"><Building2 className="h-4 w-4" /> {he.settings.company}</TabsTrigger>
          <TabsTrigger value="pipeline"><GitBranch className="h-4 w-4" /> {he.settings.pipeline}</TabsTrigger>
          <TabsTrigger value="templates"><MessageSquare className="h-4 w-4" /> {he.templates.title}</TabsTrigger>
          {isAdmin && <TabsTrigger value="automations"><Zap className="h-4 w-4" /> {he.automations.title}</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users"><UsersIcon className="h-4 w-4" /> {he.settings.users}</TabsTrigger>}
          {isAdmin && <TabsTrigger value="audit"><History className="h-4 w-4" /> {he.audit.title}</TabsTrigger>}
          {isAdmin && <TabsTrigger value="trash"><RotateCcw className="h-4 w-4" /> {he.trash.title}</TabsTrigger>}
        </TabsList>
        <TabsContent value="lists"><ListsTab /></TabsContent>
        <TabsContent value="company"><CompanyTab /></TabsContent>
        <TabsContent value="pipeline"><PipelineTab /></TabsContent>
        <TabsContent value="templates"><TemplatesTab /></TabsContent>
        {isAdmin && <TabsContent value="automations"><AutomationsTab /></TabsContent>}
        {isAdmin && <TabsContent value="users"><UsersTab /></TabsContent>}
        {isAdmin && <TabsContent value="audit"><AuditTab /></TabsContent>}
        {isAdmin && <TabsContent value="trash"><TrashTab /></TabsContent>}
      </Tabs>
    </div>
  );
}

function ListsTab() {
  const [type, setType] = useState<string>('city');
  const [value, setValue] = useState('');
  const { data } = useLists();
  const addItem = useAddListItem();
  const deleteItem = useDeleteListItem();
  const items = data?.grouped[type] ?? [];

  const add = async () => {
    if (!value.trim()) return;
    try {
      await addItem.mutateAsync({ listType: type, value: value.trim() });
      setValue('');
      toast.success(he.common.saved);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="w-48">
            <Label>{he.settings.lists}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LIST_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{he.settings.listTypes[t as keyof typeof he.settings.listTypes]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <Label>{he.common.add}</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          </div>
          <Button onClick={add}><Plus className="h-4 w-4" /> {he.common.add}</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item.id} variant="secondary" className="gap-1.5 py-1 ps-1">
              <button onClick={() => deleteItem.mutate(item.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
              {item.value}
            </Badge>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">{he.common.noResults}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyTab() {
  const { data } = useCompany();
  const update = useUpdateCompany();
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (data) setForm({ ...data });
  }, [data]);

  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    try {
      await update.mutateAsync({
        name: String(form.name ?? ''),
        businessId: (form.businessId as string) || null,
        address: (form.address as string) || null,
        phone: (form.phone as string) || null,
        email: (form.email as string) || null,
        vatRate: Number(form.vatRate) || 0,
        quoteStartNumber: Number(form.quoteStartNumber) || 1,
        exemptDealer: !!form.exemptDealer,
      });
      toast.success(he.common.saved);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const cf = he.settings.companyFields;
  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
        <div><Label>{cf.name}</Label><Input value={String(form.name ?? '')} onChange={(e) => set('name', e.target.value)} /></div>
        <div><Label>{cf.businessId}</Label><Input dir="ltr" value={String(form.businessId ?? '')} onChange={(e) => set('businessId', e.target.value)} /></div>
        <div><Label>{cf.address}</Label><Input value={String(form.address ?? '')} onChange={(e) => set('address', e.target.value)} /></div>
        <div><Label>{cf.phone}</Label><Input dir="ltr" value={String(form.phone ?? '')} onChange={(e) => set('phone', e.target.value)} /></div>
        <div><Label>{cf.email}</Label><Input dir="ltr" value={String(form.email ?? '')} onChange={(e) => set('email', e.target.value)} /></div>
        <div><Label>{cf.vatRate}</Label><Input type="number" dir="ltr" value={String(form.vatRate ?? '')} onChange={(e) => set('vatRate', Number(e.target.value))} /></div>
        <div><Label>{cf.quoteStartNumber}</Label><Input type="number" dir="ltr" value={String(form.quoteStartNumber ?? '')} onChange={(e) => set('quoteStartNumber', Number(e.target.value))} /></div>
        <div className="sm:col-span-2">
          <Button onClick={save}>{he.common.save}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineTab() {
  const { data } = usePipelineStages();
  return (
    <Card>
      <CardContent className="pt-6">
        <ol className="flex flex-wrap items-center gap-2">
          {data?.map((stage, i) => (
            <li key={stage.id} className="flex items-center gap-2">
              <Badge style={{ backgroundColor: `${stage.color}20`, color: stage.color ?? undefined }}>{stage.name}</Badge>
              {i < data.length - 1 && <span className="text-muted-foreground">←</span>}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function TemplatesTab() {
  const { data: templates } = useTemplates();
  const create = useCreateTemplate();
  const del = useDeleteTemplate();
  const [form, setForm] = useState({ channel: 'whatsapp', name: '', body: '' });

  const add = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast.error(he.common.required);
      return;
    }
    try {
      await create.mutateAsync(form);
      setForm({ channel: 'whatsapp', name: '', body: '' });
      toast.success(he.common.saved);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <p className="mb-3 text-sm text-muted-foreground">{he.templates.variablesHint}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>{he.templates.channel}</Label>
              <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(['whatsapp', 'sms', 'email'] as const).map((c) => <SelectItem key={c} value={c}>{he.templates.channels[c]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>{he.templates.name}</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="sm:col-span-3"><Label>{he.templates.body}</Label><Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} /></div>
            <div><Button onClick={add}><Plus className="h-4 w-4" /> {he.templates.add}</Button></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          {!templates || templates.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{he.templates.empty}</p> : (
            <div className="space-y-2">
              {templates.map((t) => (
                <div key={t.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div>
                    <div className="flex items-center gap-2"><span className="font-medium">{t.name}</span><Badge variant="secondary">{he.templates.channels[t.channel as keyof typeof he.templates.channels] ?? t.channel}</Badge></div>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{t.body}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => del.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditTab() {
  const { data: logs } = useAuditLog();
  const downloadBackup = async () => {
    const res = await api.get('/admin/backup', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crm-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div><div className="font-medium">{he.backup.title}</div><div className="text-sm text-muted-foreground">{he.backup.hint}</div></div>
          <Button variant="outline" onClick={downloadBackup}><Download className="h-4 w-4" /> {he.backup.download}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          {!logs || logs.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{he.audit.empty}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{he.audit.user}</TableHead><TableHead>{he.audit.entity}</TableHead><TableHead>{he.audit.action}</TableHead><TableHead>{he.audit.date}</TableHead></TableRow></TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.user?.name ?? '—'}</TableCell>
                    <TableCell>{l.entityType}</TableCell>
                    <TableCell><Badge variant="secondary">{he.audit.actions[l.action as keyof typeof he.audit.actions] ?? l.action}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(l.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrashTab() {
  const { data } = useTrash();
  const restore = useRestore();
  const all = [...(data?.contacts ?? []), ...(data?.projects ?? []), ...(data?.quotes ?? [])];
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="mb-3 text-sm text-muted-foreground">{he.trash.hint}</p>
        {all.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{he.trash.empty}</p> : (
          <div className="space-y-2">
            {all.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><span className="font-medium">{item.label}</span> <Badge variant="secondary">{item.type}</Badge></div>
                <Button variant="outline" size="sm" onClick={async () => { await restore.mutateAsync({ type: item.type, id: item.id }); toast.success(he.common.saved); }}>
                  <RotateCcw className="h-4 w-4" /> {he.trash.restore}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const TRIGGERS = ['LEAD_CREATED', 'LEAD_IDLE', 'QUOTE_ACCEPTED', 'PROJECT_STATUS_CHANGED', 'PAYMENT_OVERDUE'] as const;

function AutomationsTab() {
  const { data: rules } = useAutomations();
  const create = useCreateAutomation();
  const update = useUpdateAutomation();
  const del = useDeleteAutomation();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<string>('LEAD_IDLE');
  const [days, setDays] = useState('7');
  const [taskTitle, setTaskTitle] = useState('');

  const add = async () => {
    if (!name.trim() || !taskTitle.trim()) {
      toast.error(he.common.required);
      return;
    }
    const conditions: Record<string, unknown> = {};
    if (trigger === 'LEAD_IDLE') conditions.idleDays = Number(days) || 7;
    if (trigger === 'PAYMENT_OVERDUE') conditions.overdueDays = Number(days) || 14;
    try {
      await create.mutateAsync({
        name,
        triggerType: trigger,
        conditions,
        actions: [{ type: 'CREATE_TASK', title: taskTitle, dueInDays: 1 }],
      });
      setName(''); setTaskTitle('');
      toast.success(he.common.saved);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const needsDays = trigger === 'LEAD_IDLE' || trigger === 'PAYMENT_OVERDUE';
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <p className="mb-3 text-sm text-muted-foreground">צור חוק: כשמתרחש הטריגר — תיווצר משימה אוטומטית.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Label>{he.automations.name}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div>
              <Label>{he.automations.trigger}</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRIGGERS.map((t) => <SelectItem key={t} value={t}>{he.automations.triggers[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {needsDays && <div><Label>ימים</Label><Input type="number" dir="ltr" value={days} onChange={(e) => setDays(e.target.value)} /></div>}
            <div className={needsDays ? '' : 'sm:col-span-1'}><Label>{he.automations.actionTypes.CREATE_TASK} — {he.tasks.fields.title}</Label><Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} /></div>
            <div className="flex items-end"><Button onClick={add}><Plus className="h-4 w-4" /> {he.automations.newRule}</Button></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          {!rules || rules.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{he.automations.empty}</p>
          ) : (
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{he.automations.triggers[r.triggerType as keyof typeof he.automations.triggers] ?? r.triggerType} · {he.automations.executions}: {r._count?.executions ?? 0}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={r.isActive} onCheckedChange={(v) => update.mutate({ id: r.id, isActive: v })} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTab() {
  const { data: users } = useUsers();
  const createUser = useCreateUser();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SALES' as UserRole });

  const add = async () => {
    try {
      await createUser.mutateAsync(form);
      toast.success(he.common.saved);
      setForm({ name: '', email: '', password: '', role: 'SALES' });
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const uf = he.settings.userFields;
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-5">
          <div><Label>{uf.name}</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><Label>{uf.email}</Label><Input dir="ltr" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
          <div><Label>{uf.password}</Label><Input dir="ltr" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
          <div>
            <Label>{uf.role}</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{he.roles[r]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-end"><Button onClick={add} className="w-full"><Plus className="h-4 w-4" /> {uf.newUser}</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow><TableHead>{uf.name}</TableHead><TableHead>{uf.email}</TableHead><TableHead>{uf.role}</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell dir="ltr">{u.email}</TableCell>
                  <TableCell><Badge variant="secondary">{he.roles[u.role]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
