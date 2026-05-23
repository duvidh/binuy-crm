import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search, Download, Users, LayoutList, KanbanSquare, Trash2, UserCog } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { ContactsKanban } from '@/components/contacts/ContactsKanban';
import { ContactFormDialog } from '@/components/contacts/ContactFormDialog';
import { useContacts, useBulkContacts, type ContactQuery } from '@/hooks/useContacts';
import { useListValues } from '@/hooks/useSettings';
import { useUsers } from '@/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { he } from '@/locales/he';

export function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [filters, setFilters] = useState<Partial<ContactQuery>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const cities = useListValues('city');
  const projectTypes = useListValues('projectType');
  const { data: users } = useUsers();
  const bulk = useBulkContacts();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const query: ContactQuery = useMemo(
    () => ({ page, pageSize: 25, search: debouncedSearch, sortBy, sortDir, ...filters }),
    [page, debouncedSearch, sortBy, sortDir, filters],
  );
  const { data, isLoading } = useContacts(query);

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);

  const onSort = (col: string) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const runBulk = async (action: string, value?: string) => {
    await bulk.mutateAsync({ ids: selectedIds, action, value });
    toast.success(he.common.saved);
    setSelected({});
  };

  const exportCsv = async () => {
    const res = await api.get('/contacts/export', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const setFilter = (key: keyof ContactQuery, value: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value === 'all' ? undefined : value }));
  };

  return (
    <div>
      <PageHeader title={he.contacts.title}>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" /> {he.common.export}
        </Button>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> {he.contacts.newContact}
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={he.common.search}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pe-9"
          />
        </div>

        <Select onValueChange={(v) => setFilter('status', v)} defaultValue="all">
          <SelectTrigger className="w-32"><SelectValue placeholder={he.contacts.fields.status} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{he.common.all}</SelectItem>
            <SelectItem value="LEAD">{he.contacts.status.LEAD}</SelectItem>
            <SelectItem value="CUSTOMER">{he.contacts.status.CUSTOMER}</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => setFilter('city', v)} defaultValue="all">
          <SelectTrigger className="w-32"><SelectValue placeholder={he.contacts.fields.city} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{he.common.all}</SelectItem>
            {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => setFilter('projectType', v)} defaultValue="all">
          <SelectTrigger className="w-36"><SelectValue placeholder={he.contacts.fields.projectType} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{he.common.all}</SelectItem>
            {projectTypes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ms-auto flex rounded-lg border p-0.5">
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')}>
            <LayoutList className="h-4 w-4" /> {he.contacts.listView}
          </Button>
          <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('kanban')}>
            <KanbanSquare className="h-4 w-4" /> {he.contacts.kanbanView}
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && view === 'list' && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-secondary/50 px-3 py-2 text-sm">
          <span className="font-medium">{he.common.selected}: {selectedIds.length}</span>
          <Select onValueChange={(v) => runBulk('assign', v === 'none' ? '' : v)}>
            <SelectTrigger className="h-8 w-44"><UserCog className="h-4 w-4" /><SelectValue placeholder={he.contacts.bulk.assign} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{he.common.none}</SelectItem>
              {users?.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => runBulk('leadType', v)}>
            <SelectTrigger className="h-8 w-36"><SelectValue placeholder={he.contacts.bulk.changeLeadType} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW">{he.contacts.leadType.NEW}</SelectItem>
              <SelectItem value="HOT">{he.contacts.leadType.HOT}</SelectItem>
              <SelectItem value="COLD">{he.contacts.leadType.COLD}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={() => setConfirmBulkDelete(true)}>
            <Trash2 className="h-4 w-4" /> {he.common.delete}
          </Button>
        </div>
      )}

      {view === 'kanban' ? (
        <ContactsKanban />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={Users} title={he.contacts.emptyTitle} description={he.contacts.emptyDesc} actionLabel={he.contacts.newContact} onAction={() => setFormOpen(true)} />
      ) : (
        <>
          <ContactsTable
            contacts={data.data}
            selected={selected}
            onSelectedChange={setSelected}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={onSort}
          />
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{data.pagination.total} {he.contacts.title}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{he.common.prev}</Button>
              <span>{he.common.page} {data.pagination.page} {he.common.of} {data.pagination.totalPages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>{he.common.next}</Button>
            </div>
          </div>
        </>
      )}

      <ContactFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        description={`${selectedIds.length} ${he.contacts.title}`}
        onConfirm={() => runBulk('delete')}
      />
    </div>
  );
}
