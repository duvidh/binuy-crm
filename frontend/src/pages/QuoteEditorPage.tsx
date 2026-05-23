import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowRight, Save, BookOpen, Loader2, Send, Download } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuote, useCreateQuote, useUpdateQuote, usePriceCatalog, useSendQuote } from '@/hooks/useQuotes';
import { useContacts } from '@/hooks/useContacts';
import { useListValues } from '@/hooks/useSettings';
import { useCompany } from '@/hooks/useSettings';
import { computeQuoteTotals } from '@/lib/quoteTotals';
import { formatCurrency } from '@/lib/format';
import { apiErrorMessage } from '@/lib/api';
import { downloadQuotePdf } from '@/lib/quotePdf';
import { he } from '@/locales/he';
import type { QuoteItem, Quote } from '@/types';

interface Row extends QuoteItem {
  _key: string;
}

let keyCounter = 0;
const newRow = (init: Partial<Row> = {}): Row => ({
  _key: `r${keyCounter++}`,
  section: '',
  description: '',
  quantity: 1,
  unit: '',
  unitPrice: 0,
  ...init,
});

export function QuoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const { data: quote, isLoading } = useQuote(id);
  const { data: company } = useCompany();
  const { data: catalog } = usePriceCatalog();
  const units = useListValues('unit');
  const { data: contactsData } = useContacts({ pageSize: 100, sortBy: 'fullName', sortDir: 'asc' });
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const sendQuote = useSendQuote();

  const [contactId, setContactId] = useState('');
  const [vatRate, setVatRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Row[]>([newRow()]);

  useEffect(() => {
    if (company && isNew) setVatRate(company.exemptDealer ? 0 : company.vatRate);
  }, [company, isNew]);

  useEffect(() => {
    if (quote) {
      setContactId(quote.contactId);
      setVatRate(quote.vatRate);
      setDiscount(quote.discount);
      setDiscountType(quote.discountType);
      setValidUntil(quote.validUntil?.slice(0, 10) ?? '');
      setNotes(quote.notes ?? '');
      setRows(quote.items?.length ? quote.items.map((it) => newRow(it)) : [newRow()]);
    }
  }, [quote]);

  const totals = useMemo(() => computeQuoteTotals(rows, vatRate, discount, discountType), [rows, vatRate, discount, discountType]);

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, ...patch } : r)));
  const removeRow = (key: string) => setRows((rs) => rs.filter((r) => r._key !== key));

  const save = async (): Promise<string | null> => {
    if (!contactId) {
      toast.error(he.quotes.client + ' ' + he.common.required);
      return null;
    }
    const payload = {
      contactId,
      vatRate,
      discount,
      discountType,
      validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      notes,
      items: rows
        .filter((r) => r.description.trim())
        .map((r, i) => ({
          section: r.section || null,
          description: r.description,
          quantity: Number(r.quantity) || 0,
          unit: r.unit || null,
          unitPrice: Number(r.unitPrice) || 0,
          order: i,
        })),
    };
    const quotePayload = payload as unknown as Partial<Quote>;
    try {
      if (isNew) {
        const created = await createQuote.mutateAsync(quotePayload);
        toast.success(he.common.saved);
        navigate(`/quotes/${created.id}`, { replace: true });
        return created.id;
      }
      await updateQuote.mutateAsync({ id: id!, ...quotePayload });
      toast.success(he.common.saved);
      return id!;
    } catch (e) {
      toast.error(apiErrorMessage(e));
      return null;
    }
  };

  const onSend = async () => {
    const savedId = await save();
    if (!savedId) return;
    try {
      const res = await sendQuote.mutateAsync(savedId);
      const url = `${window.location.origin}${res.signUrl}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success(`${he.quotes.sendLink}: ${url}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const onDownloadPdf = () => {
    const contact = contactsData?.data.find((c) => c.id === contactId);
    downloadQuotePdf({
      quoteNumber: quote?.quoteNumber ?? 'טיוטה',
      date: quote?.date ?? new Date().toISOString(),
      validUntil: validUntil || null,
      clientName: contact?.fullName ?? '',
      items: rows.filter((r) => r.description.trim()),
      vatRate,
      discount,
      discountType,
      totals,
      notes,
      company: company ?? null,
    });
  };

  if (!isNew && isLoading) {
    return <div className="text-muted-foreground">{he.common.loading}</div>;
  }

  return (
    <div className="max-w-5xl">
      <PageHeader title={isNew ? he.quotes.newQuote : `${he.quotes.editQuote} ${quote?.quoteNumber ?? ''}`}>
        <Button variant="ghost" onClick={() => navigate('/quotes')}><ArrowRight className="h-4 w-4" /> {he.common.back}</Button>
        {!isNew && <Button variant="outline" onClick={onDownloadPdf}><Download className="h-4 w-4" /> {he.quotes.downloadPdf}</Button>}
        <Button variant="outline" onClick={onSend}><Send className="h-4 w-4" /> {he.quotes.send}</Button>
        <Button onClick={save} disabled={createQuote.isPending || updateQuote.isPending}>
          {(createQuote.isPending || updateQuote.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {he.common.save}
        </Button>
      </PageHeader>

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-3">
          <div>
            <Label>{he.quotes.client} *</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger><SelectValue placeholder={he.quotes.client} /></SelectTrigger>
              <SelectContent>
                {contactsData?.data.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{he.quotes.validUntil}</Label>
            <Input type="date" dir="ltr" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
          <div>
            <Label>{he.quotes.vat} (%)</Label>
            <Input type="number" dir="ltr" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{he.quotes.addItem}</h3>
            {catalog && catalog.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm"><BookOpen className="h-4 w-4" /> {he.quotes.fromCatalog}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-1">
                  <div className="max-h-64 overflow-y-auto">
                    {catalog.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setRows((rs) => [...rs, newRow({ description: item.name, unit: item.unit, unitPrice: item.defaultPrice, section: item.category })])}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                      >
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">{formatCurrency(item.defaultPrice)}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{he.quotes.section}</TableHead>
                <TableHead>{he.quotes.description}</TableHead>
                <TableHead className="w-20">{he.quotes.quantity}</TableHead>
                <TableHead className="w-24">{he.quotes.unit}</TableHead>
                <TableHead className="w-28">{he.quotes.unitPrice}</TableHead>
                <TableHead className="w-28">{he.quotes.lineTotal}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._key}>
                  <TableCell className="p-1"><Input className="h-9" value={row.section ?? ''} onChange={(e) => updateRow(row._key, { section: e.target.value })} /></TableCell>
                  <TableCell className="p-1"><Input className="h-9" value={row.description} onChange={(e) => updateRow(row._key, { description: e.target.value })} /></TableCell>
                  <TableCell className="p-1"><Input className="h-9" type="number" dir="ltr" value={row.quantity} onChange={(e) => updateRow(row._key, { quantity: Number(e.target.value) })} /></TableCell>
                  <TableCell className="p-1">
                    <Select value={row.unit || ''} onValueChange={(v) => updateRow(row._key, { unit: v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1"><Input className="h-9" type="number" dir="ltr" value={row.unitPrice} onChange={(e) => updateRow(row._key, { unitPrice: Number(e.target.value) })} /></TableCell>
                  <TableCell className="p-1 font-medium">{formatCurrency((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0))}</TableCell>
                  <TableCell className="p-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(row._key)} disabled={rows.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setRows((rs) => [...rs, newRow()])}>
            <Plus className="h-4 w-4" /> {he.quotes.addItem}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <Label>{he.quotes.notes}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 pt-5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{he.quotes.subtotal}</span><span>{formatCurrency(totals.subtotal)}</span></div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{he.quotes.discount}</span>
              <div className="flex items-center gap-1">
                <Input className="h-8 w-24" type="number" dir="ltr" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'AMOUNT' | 'PERCENT')}>
                  <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">₪</SelectItem>
                    <SelectItem value="PERCENT">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">{he.quotes.vat} ({vatRate}%)</span><span>{formatCurrency(totals.vatAmount)}</span></div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>{he.quotes.total}</span><span className="text-primary">{formatCurrency(totals.total)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
