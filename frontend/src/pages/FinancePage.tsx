import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Star, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePayments, useAging, useCashflow, useSuppliers, useCreateSupplier, useDeleteSupplier } from '@/hooks/useFinance';
import { formatCurrency, formatDate } from '@/lib/format';
import { paymentStatusVariant } from '@/lib/contactMeta';
import { apiErrorMessage } from '@/lib/api';
import { he } from '@/locales/he';

export function FinancePage() {
  return (
    <div>
      <PageHeader title={he.finance.title} />
      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">{he.finance.payments}</TabsTrigger>
          <TabsTrigger value="aging">{he.finance.aging}</TabsTrigger>
          <TabsTrigger value="cashflow">{he.finance.cashflow}</TabsTrigger>
          <TabsTrigger value="suppliers">{he.finance.suppliers}</TabsTrigger>
        </TabsList>
        <TabsContent value="payments"><PaymentsTab /></TabsContent>
        <TabsContent value="aging"><AgingTab /></TabsContent>
        <TabsContent value="cashflow"><CashflowTab /></TabsContent>
        <TabsContent value="suppliers"><SuppliersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentsTab() {
  const { data } = usePayments();
  const payments = data?.data ?? [];
  return (
    <Card>
      <CardContent className="pt-6">
        {payments.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{he.finance.emptyPayments}</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>{he.quotes.client}</TableHead><TableHead>{he.finance.amount}</TableHead><TableHead>{he.finance.dueDate}</TableHead><TableHead>{he.finance.method}</TableHead><TableHead>{he.finance.status}</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.contact?.fullName ?? p.project?.name ?? '—'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                  <TableCell>{p.dueDate ? formatDate(p.dueDate) : '—'}</TableCell>
                  <TableCell>{p.method ?? '—'}</TableCell>
                  <TableCell><Badge variant={paymentStatusVariant[p.status]}>{he.finance.paymentStatus[p.status]}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AgingTab() {
  const { data } = useAging();
  if (!data) return null;
  const b = he.finance.agingBuckets;
  const keys = ['current', 'd30', 'd60', 'd90', 'd90plus'] as const;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {keys.map((k) => (
          <Card key={k}><CardContent className="pt-5"><div className="text-xs text-muted-foreground">{b[k]}</div><div className="mt-1 text-lg font-bold" dir="ltr">{formatCurrency(data.buckets[k] ?? 0)}</div></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          {data.rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{he.finance.emptyPayments}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{he.quotes.client}</TableHead><TableHead>{he.projects.title}</TableHead><TableHead>{he.finance.amount}</TableHead><TableHead>ימי איחור</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.contact ?? '—'}</TableCell>
                    <TableCell>{r.project ?? '—'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(r.amount)}</TableCell>
                    <TableCell dir="ltr">{r.days > 0 ? r.days : 0}</TableCell>
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

function CashflowTab() {
  const [days, setDays] = useState(90);
  const { data } = useCashflow(days);
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {[30, 60, 90].map((d) => (
          <Button key={d} variant={days === d ? 'default' : 'outline'} size="sm" onClick={() => setDays(d)}>{d} ימים</Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4 text-success" /> {he.finance.expectedIncome}</div><div className="mt-1 text-xl font-bold text-success" dir="ltr">{formatCurrency(data?.incomeTotal)}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingDown className="h-4 w-4 text-destructive" /> {he.finance.expectedExpenses}</div><div className="mt-1 text-xl font-bold text-destructive" dir="ltr">{formatCurrency(data?.expenseTotal)}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4" /> {he.finance.netCashflow}</div><div className={`mt-1 text-xl font-bold ${(data?.net ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`} dir="ltr">{formatCurrency(data?.net)}</div></CardContent></Card>
      </div>
    </div>
  );
}

function SuppliersTab() {
  const { data: suppliers } = useSuppliers();
  const create = useCreateSupplier();
  const del = useDeleteSupplier();
  const [form, setForm] = useState<Record<string, string>>({});

  const add = async () => {
    if (!form.name?.trim()) return;
    try {
      await create.mutateAsync({ name: form.name, field: form.field || null, phone: form.phone || null, businessId: form.businessId || null, rating: form.rating ? Number(form.rating) : null });
      setForm({});
      toast.success(he.common.saved);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const sf = he.finance.supplierFields;
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid grid-cols-2 gap-2 pt-6 sm:grid-cols-6">
          <div><Label>{sf.name}</Label><Input value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><Label>{sf.field}</Label><Input value={form.field ?? ''} onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))} /></div>
          <div><Label>{sf.phone}</Label><Input dir="ltr" value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          <div><Label>{sf.businessId}</Label><Input dir="ltr" value={form.businessId ?? ''} onChange={(e) => setForm((f) => ({ ...f, businessId: e.target.value }))} /></div>
          <div><Label>{sf.rating}</Label><Input type="number" dir="ltr" min={1} max={5} value={form.rating ?? ''} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} /></div>
          <div className="flex items-end"><Button onClick={add} className="w-full"><Plus className="h-4 w-4" /> {he.finance.addSupplier}</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          {!suppliers || suppliers.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{he.finance.emptySuppliers}</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>{sf.name}</TableHead><TableHead>{sf.field}</TableHead><TableHead>{sf.phone}</TableHead><TableHead>{sf.rating}</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.field ?? '—'}</TableCell>
                    <TableCell dir="ltr">{s.phone ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < (s.rating ?? 0) ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />)}</div>
                    </TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
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
