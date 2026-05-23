import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Building2, ListTree, Users as UsersIcon, GitBranch } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
          {isAdmin && <TabsTrigger value="users"><UsersIcon className="h-4 w-4" /> {he.settings.users}</TabsTrigger>}
        </TabsList>
        <TabsContent value="lists"><ListsTab /></TabsContent>
        <TabsContent value="company"><CompanyTab /></TabsContent>
        <TabsContent value="pipeline"><PipelineTab /></TabsContent>
        {isAdmin && <TabsContent value="users"><UsersTab /></TabsContent>}
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
