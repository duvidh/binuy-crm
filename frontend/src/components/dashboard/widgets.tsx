import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import {
  Users,
  TrendingUp,
  DollarSign,
  Wallet,
  UserPlus,
  Percent,
  Building2,
  AlertTriangle,
  ListChecks,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDashboardStats, useRevenueSeries } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { he } from '@/locales/he';

const CHART_COLORS = ['#2563eb', '#f97316', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#eab308', '#ec4899'];

function KpiCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent?: string }) {
  return (
    <div className="flex h-full flex-col justify-between p-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ?? 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight" dir="ltr">{value}</div>
    </div>
  );
}

function WidgetSkeleton() {
  return <Skeleton className="h-full min-h-[80px] w-full" />;
}

function EmptyText({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{text}</div>;
}

// --- KPI widgets ---

export function LeadsSummaryWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  const k = data.kpis;
  return (
    <div className="flex h-full flex-col p-1">
      <span className="text-sm text-muted-foreground">{he.widgets.leadsSummary}</span>
      <div className="mt-auto grid grid-cols-3 gap-2 pt-2">
        {([['new', k.leadsNew, 'text-primary'], ['hot', k.leadsHot, 'text-destructive'], ['cold', k.leadsCold, 'text-muted-foreground']] as const).map(
          ([key, val, color]) => (
            <div key={key} className="rounded-lg bg-secondary/60 p-2 text-center">
              <div className={`text-2xl font-bold ${color}`}>{val}</div>
              <div className="text-xs text-muted-foreground">{he.widgets[key]}</div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export function MonthlyConversionsWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  return <KpiCard icon={TrendingUp} label={he.widgets.monthlyConversions} value={`${data.kpis.convertedThisMonth}`} accent="bg-success/10 text-success" />;
}

export function PaymentsThisMonthWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  return <KpiCard icon={DollarSign} label={he.widgets.paymentsThisMonth} value={formatCurrency(data.kpis.paidThisMonth)} accent="bg-success/10 text-success" />;
}

export function PipelineBudgetWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  return <KpiCard icon={Wallet} label={he.widgets.pipelineBudget} value={formatCurrency(data.kpis.pipelineBudget)} accent="bg-accent/10 text-accent" />;
}

export function NewCustomersWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  return <KpiCard icon={UserPlus} label={he.widgets.newCustomers} value={`${data.kpis.customersThisMonth}`} />;
}

export function ConversionRateWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  return <KpiCard icon={Percent} label={he.widgets.conversionRate} value={`${data.kpis.conversionRate}%`} accent="bg-accent/10 text-accent" />;
}

export function ActiveProjectsKpiWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  return <KpiCard icon={Building2} label={he.widgets.activeProjects} value={`${data.kpis.activeProjects}`} />;
}

// --- List widgets ---

export function PendingQuotesWidget() {
  const { data, isLoading } = useDashboardStats();
  const navigate = useNavigate();
  if (isLoading || !data) return <WidgetSkeleton />;
  if (data.pendingQuotes.length === 0) return <EmptyText text={he.widgets.noQuotes} />;
  return (
    <ul className="h-full space-y-1 overflow-y-auto">
      {data.pendingQuotes.map((q) => (
        <li key={q.id} onClick={() => navigate(`/quotes/${q.id}`)} className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary">
          <span className="truncate">{q.contact?.fullName ?? q.quoteNumber}</span>
          <span className="font-medium text-primary">{formatCurrency(q.total)}</span>
        </li>
      ))}
    </ul>
  );
}

export function TodayTasksWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  if (data.openTasks.length === 0) return <EmptyText text={he.widgets.noTasks} />;
  return (
    <ul className="h-full space-y-1 overflow-y-auto">
      {data.openTasks.map((t) => (
        <li key={t.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary">
          <ListChecks className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">{t.title}</span>
        </li>
      ))}
    </ul>
  );
}

export function OverdueTasksWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  if (data.overdueTasks.length === 0) return <EmptyText text={he.widgets.noTasks} />;
  return (
    <ul className="h-full space-y-1 overflow-y-auto">
      {data.overdueTasks.map((t) => (
        <li key={t.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="truncate">{t.title}</span>
        </li>
      ))}
    </ul>
  );
}

export function ActiveProjectsWidget() {
  const { data, isLoading } = useDashboardStats();
  const navigate = useNavigate();
  if (isLoading || !data) return <WidgetSkeleton />;
  if (data.activeProjectsList.length === 0) return <EmptyText text={he.widgets.noProjects} />;
  return (
    <ul className="h-full space-y-2 overflow-y-auto">
      {data.activeProjectsList.map((p) => (
        <li key={p.id} onClick={() => navigate('/projects')} className="cursor-pointer rounded-md px-2 py-1.5 hover:bg-secondary">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate font-medium">{p.name}</span>
            <span className="text-xs text-muted-foreground">{p.progress}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-secondary">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OverduePaymentsWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  if (data.overduePayments.length === 0) return <EmptyText text={he.widgets.noPayments} />;
  const total = data.overduePayments.reduce((s, p) => s + p.amount, 0);
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div className="mt-2 text-2xl font-bold text-destructive">{formatCurrency(total)}</div>
      <div className="text-sm text-muted-foreground">{data.overduePayments.length} {he.widgets.overduePayments}</div>
    </div>
  );
}

// --- Chart widgets ---

export function RevenueChartWidget() {
  const { data, isLoading } = useRevenueSeries(6);
  if (isLoading || !data) return <WidgetSkeleton />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" fontSize={11} reversed />
        <YAxis fontSize={11} tickFormatter={(v) => `${v / 1000}k`} orientation="right" />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PieWidget({ data, empty }: { data: { name: string; value: number }[]; empty: string }) {
  if (data.length === 0) return <EmptyText text={empty} />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label={(e) => e.name}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function LeadsByCityWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  return <PieWidget data={data.leadsByCity} empty={he.common.noResults} />;
}

export function LeadsByTypeWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.leadsByType} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" fontSize={11} />
        <YAxis fontSize={11} allowDecimals={false} orientation="right" />
        <Tooltip />
        <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SalesFunnelWidget() {
  const { data, isLoading } = useDashboardStats();
  if (isLoading || !data) return <WidgetSkeleton />;
  const k = data.kpis;
  const funnel = [
    { name: he.contacts.leadType.NEW, value: k.leadsNew + k.leadsHot + k.leadsCold, fill: CHART_COLORS[0] },
    { name: he.contacts.leadType.HOT, value: k.leadsHot, fill: CHART_COLORS[1] },
    { name: he.widgets.monthlyConversions, value: k.convertedThisMonth, fill: CHART_COLORS[2] },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <FunnelChart>
        <Tooltip />
        <Funnel dataKey="value" data={funnel} isAnimationActive>
          <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

export function MiniCalendarWidget() {
  const { data } = useDashboardStats();
  return (
    <div className="h-full space-y-1 overflow-y-auto">
      {(data?.openTasks ?? []).slice(0, 6).map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded-md border-s-2 border-primary bg-secondary/40 px-2 py-1.5 text-sm">
          <span className="truncate">{t.title}</span>
        </div>
      ))}
      {(!data || data.openTasks.length === 0) && <EmptyText text={he.widgets.noTasks} />}
    </div>
  );
}
