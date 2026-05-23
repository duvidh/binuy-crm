import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, FileText, Search, MoreVertical, Copy, Trash2, Send } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQuotes, useDeleteQuote, useDuplicateQuote, useSendQuote } from '@/hooks/useQuotes';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatDate } from '@/lib/format';
import { quoteStatusLabel, quoteStatusVariant } from '@/lib/contactMeta';
import { apiErrorMessage } from '@/lib/api';
import { he } from '@/locales/he';

export function QuotesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [status, setStatus] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data, isLoading } = useQuotes({ search: debounced, status });
  const deleteQuote = useDeleteQuote();
  const duplicateQuote = useDuplicateQuote();
  const sendQuote = useSendQuote();

  const onSend = async (id: string) => {
    try {
      const res = await sendQuote.mutateAsync(id);
      const url = `${window.location.origin}${res.signUrl}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success(`${he.quotes.sendLink}: ${url}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title={he.quotes.title}>
        <Button onClick={() => navigate('/quotes/new')}>
          <Plus className="h-4 w-4" /> {he.quotes.newQuote}
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={`${he.common.search} ${he.quotes.number}`} value={search} onChange={(e) => setSearch(e.target.value)} className="pe-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{he.common.all}</SelectItem>
            {(['DRAFT', 'SENT', 'ACCEPTED', 'SIGNED', 'REJECTED', 'EXPIRED'] as const).map((s) => (
              <SelectItem key={s} value={s}>{he.quotes.statuses[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={FileText} title={he.quotes.emptyTitle} description={he.quotes.emptyDesc} actionLabel={he.quotes.newQuote} onAction={() => navigate('/quotes/new')} />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{he.quotes.number}</TableHead>
                <TableHead>{he.quotes.client}</TableHead>
                <TableHead>{he.quotes.date}</TableHead>
                <TableHead>{he.quotes.total}</TableHead>
                <TableHead>{he.quotes.status}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((q) => (
                <TableRow key={q.id} className="cursor-pointer" onClick={() => navigate(`/quotes/${q.id}`)}>
                  <TableCell className="font-medium" dir="ltr">{q.quoteNumber}</TableCell>
                  <TableCell>{'fullName' in (q.contact ?? {}) ? (q.contact as { fullName: string }).fullName : '—'}</TableCell>
                  <TableCell>{formatDate(q.date)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(q.total)}</TableCell>
                  <TableCell><Badge variant={quoteStatusVariant[q.status]}>{quoteStatusLabel(q.status)}</Badge></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSend(q.id)}><Send className="h-4 w-4" /> {he.quotes.send}</DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => { await duplicateQuote.mutateAsync(q.id); toast.success(he.common.saved); }}><Copy className="h-4 w-4" /> {he.quotes.duplicate}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(q.id)}><Trash2 className="h-4 w-4" /> {he.common.delete}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await deleteQuote.mutateAsync(deleteId);
            toast.success(he.common.deleted);
          }
        }}
      />
    </div>
  );
}
