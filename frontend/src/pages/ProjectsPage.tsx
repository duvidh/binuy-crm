import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { useProjects } from '@/hooks/useProjects';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/format';
import { projectStatusLabel, projectStatusVariant } from '@/lib/contactMeta';
import { he } from '@/locales/he';
import type { ProjectStatus } from '@/types';

const STATUSES: ProjectStatus[] = ['PLANNING', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

export function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [status, setStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const { data, isLoading } = useProjects({ search: debounced, status });

  return (
    <div>
      <PageHeader title={he.projects.title}>
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> {he.projects.newProject}</Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={he.common.search} value={search} onChange={(e) => setSearch(e.target.value)} className="pe-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{he.common.all}</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{he.projects.status[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={Building2} title={he.projects.emptyTitle} description={he.projects.emptyDesc} actionLabel={he.projects.newProject} onAction={() => setFormOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((p) => (
            <Card key={p.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/projects/${p.id}`)}>
              <CardContent className="pt-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{p.name}</h3>
                  <Badge variant={projectStatusVariant[p.status]}>{projectStatusLabel(p.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{p.contact?.fullName}{p.city ? ` · ${p.city}` : ''}</p>
                {p.budget != null && <p className="mt-2 text-sm font-medium text-primary">{formatCurrency(p.budget)}</p>}
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{he.projects.fields.progress}</span><span>{p.progress}%</span></div>
                  <div className="h-2 w-full rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary" style={{ width: `${p.progress}%` }} /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
