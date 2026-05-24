import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSalesReport, useLeadSourcesReport, useProfitabilityReport, useSalesByRepReport } from '@/hooks/useReports';
import { formatCurrency } from '@/lib/format';
import { he } from '@/locales/he';

function exportRows(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  const range = { from, to };

  return (
    <div>
      <PageHeader title={he.reports.title} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div><Label>{he.reports.from}</Label><Input type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>{he.reports.to}</Label><Input type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="sales">{he.reports.sales}</TabsTrigger>
          <TabsTrigger value="sources">{he.reports.leadSources}</TabsTrigger>
          <TabsTrigger value="profitability">{he.reports.profitability}</TabsTrigger>
          <TabsTrigger value="reps">{he.reports.salesByRep}</TabsTrigger>
        </TabsList>
        <TabsContent value="sales"><SalesReport range={range} /></TabsContent>
        <TabsContent value="sources"><LeadSourcesReport range={range} /></TabsContent>
        <TabsContent value="profitability"><ProfitabilityReport /></TabsContent>
        <TabsContent value="reps"><RepsReport range={range} /></TabsContent>
      </Tabs>
    </div>
  );
}

function SalesReport({ range }: { range: { from: string; to: string } }) {
  const { data } = useSalesReport(range);
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={he.reports.totalQuotes} value={String(data.totalQuotes)} />
        <Stat label={he.reports.wonQuotes} value={String(data.wonQuotes)} />
        <Stat label={he.reports.wonValue} value={formatCurrency(data.wonValue)} />
        <Stat label={he.reports.winRate} value={`${data.winRate}%`} />
      </div>
      <Card><CardContent className="pt-6">
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" fontSize={12} reversed />
              <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} orientation="right" />
              <Tooltip formatter={(v: number) => formatCurrency(v)} wrapperStyle={{ direction: 'rtl' }} />
              <Legend wrapperStyle={{ direction: 'rtl' }} />
              <Bar dataKey="quoted" name={he.reports.quoted} fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="won" name={he.reports.won} fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent></Card>
    </div>
  );
}

function LeadSourcesReport({ range }: { range: { from: string; to: string } }) {
  const { data } = useLeadSourcesReport(range);
  if (!data || data.length === 0) return <Empty />;
  return (
    <Card><CardContent className="pt-6">
      <div className="mb-3 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportRows('lead-sources.csv', [he.reports.source, he.reports.count, he.reports.converted, he.reports.conversionRate, he.reports.totalValue], data.map((r) => [r.source, r.count, r.converted, `${r.conversionRate}%`, r.value]))}>
          <Download className="h-4 w-4" /> {he.reports.export}
        </Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>{he.reports.source}</TableHead><TableHead>{he.reports.count}</TableHead><TableHead>{he.reports.converted}</TableHead><TableHead>{he.reports.conversionRate}</TableHead><TableHead>{he.reports.totalValue}</TableHead></TableRow></TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.source}><TableCell className="font-medium">{r.source}</TableCell><TableCell>{r.count}</TableCell><TableCell>{r.converted}</TableCell><TableCell>{r.conversionRate}%</TableCell><TableCell>{formatCurrency(r.value)}</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}

function ProfitabilityReport() {
  const { data } = useProfitabilityReport();
  if (!data || data.length === 0) return <Empty />;
  return (
    <Card><CardContent className="pt-6">
      <Table>
        <TableHeader><TableRow><TableHead>{he.reports.project}</TableHead><TableHead>{he.reports.revenue}</TableHead><TableHead>{he.reports.expenses}</TableHead><TableHead>{he.reports.profit}</TableHead><TableHead>{he.reports.margin}</TableHead></TableRow></TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{formatCurrency(r.revenue)}</TableCell>
              <TableCell>{formatCurrency(r.expenses)}</TableCell>
              <TableCell className={r.profit >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(r.profit)}</TableCell>
              <TableCell>{r.margin}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}

function RepsReport({ range }: { range: { from: string; to: string } }) {
  const { data } = useSalesByRepReport(range);
  if (!data || data.length === 0) return <Empty />;
  return (
    <Card><CardContent className="pt-6">
      <Table>
        <TableHeader><TableRow><TableHead>{he.reports.rep}</TableHead><TableHead>{he.reports.leads}</TableHead><TableHead>{he.reports.customers}</TableHead><TableHead>{he.reports.conversionRate}</TableHead></TableRow></TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.leads}</TableCell><TableCell>{r.customers}</TableCell><TableCell>{r.conversionRate}%</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="pt-5"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-xl font-bold" dir="ltr">{value}</div></CardContent></Card>;
}
function Empty() {
  return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{he.reports.noData}</CardContent></Card>;
}
