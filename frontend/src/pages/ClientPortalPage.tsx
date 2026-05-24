import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { HardHat, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { quoteStatusLabel, quoteStatusVariant, projectStatusLabel, projectStatusVariant, paymentStatusVariant } from '@/lib/contactMeta';
import { he } from '@/locales/he';
import type { QuoteStatus, ProjectStatus } from '@/types';

const baseURL = import.meta.env.VITE_API_URL || '/api';

interface PortalData {
  contact: { fullName: string } | null;
  company: { name: string } | null;
  quotes: { id: string; quoteNumber: string; total: number; status: QuoteStatus; date: string }[];
  projects: { id: string; name: string; status: ProjectStatus; progress: number }[];
  payments: { id: string; amount: number; status: 'PAID' | 'PENDING' | 'OVERDUE'; dueDate?: string | null }[];
}

export function ClientPortalPage() {
  const { token } = useParams();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${baseURL}/public/portal/${token}`)
      .then((res) => setData(res.data))
      .catch((e) => setError(e.response?.data?.error ?? he.portal.notFound))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (error || !data) return <div className="flex h-screen items-center justify-center text-destructive">{error || he.portal.notFound}</div>;

  return (
    <div className="min-h-screen bg-secondary/30 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><HardHat className="h-5 w-5" /></div>
          <span className="text-lg font-bold">{data.company?.name ?? he.app.name}</span>
        </div>
        <h1 className="mb-4 text-center text-xl font-semibold">{he.portal.welcome} {data.contact?.fullName}</h1>

        <div className="space-y-4">
          <Section title={he.portal.projects} empty={data.projects.length === 0}>
            {data.projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <span>{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{p.progress}%</span>
                  <Badge variant={projectStatusVariant[p.status]}>{projectStatusLabel(p.status)}</Badge>
                </div>
              </div>
            ))}
          </Section>

          <Section title={he.portal.quotes} empty={data.quotes.length === 0}>
            {data.quotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <span dir="ltr">{q.quoteNumber}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatCurrency(q.total)}</span>
                  <Badge variant={quoteStatusVariant[q.status]}>{quoteStatusLabel(q.status)}</Badge>
                </div>
              </div>
            ))}
          </Section>

          <Section title={he.portal.payments} empty={data.payments.length === 0}>
            {data.payments.map((pay) => (
              <div key={pay.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <span>{pay.dueDate ? formatDate(pay.dueDate) : '—'}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatCurrency(pay.amount)}</span>
                  <Badge variant={paymentStatusVariant[pay.status]}>{he.finance.paymentStatus[pay.status]}</Badge>
                </div>
              </div>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <h2 className="mb-2 font-semibold">{title}</h2>
        {empty ? <p className="py-3 text-sm text-muted-foreground">{he.common.noResults}</p> : children}
      </CardContent>
    </Card>
  );
}
