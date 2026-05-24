import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, HardHat, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/format';
import { he } from '@/locales/he';
import type { Quote, CompanySettings } from '@/types';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export function QuoteSignPage() {
  const { token } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState('');
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  useEffect(() => {
    axios
      .get(`${baseURL}/public/quotes/${token}`)
      .then((res) => {
        setQuote(res.data.quote);
        setCompany(res.data.company);
        if (res.data.quote.signedAt) setSigned(true);
      })
      .catch((e) => setError(e.response?.data?.error ?? he.common.error))
      .finally(() => setLoading(false));
  }, [token]);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1e293b';
    ctx.lineCap = 'round';
    ctx.stroke();
    hasDrawn.current = true;
  };
  const end = () => (drawing.current = false);
  const clear = () => {
    const c = canvasRef.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    hasDrawn.current = false;
  };

  const submit = async () => {
    if (!signerName.trim() || !hasDrawn.current) return;
    setSubmitting(true);
    try {
      await axios.post(`${baseURL}/public/quotes/${token}/sign`, {
        signerName,
        signatureData: canvasRef.current!.toDataURL(),
      });
      setSigned(true);
    } catch (e) {
      if (axios.isAxiosError(e)) setError(e.response?.data?.error ?? he.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (error && !quote) {
    return <div className="flex h-screen items-center justify-center text-destructive">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-secondary/30 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-2 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><HardHat className="h-5 w-5" /></div>
          <span className="text-lg font-bold">{company?.name ?? he.app.name}</span>
        </div>

        {signed ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <CheckCircle2 className="h-14 w-14 text-success" />
              <h2 className="mt-4 text-xl font-bold">{he.quotes.sign.success}</h2>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between border-b pb-4">
                <div>
                  <h1 className="text-xl font-bold">הצעת מחיר {quote?.quoteNumber}</h1>
                  <p className="text-sm text-muted-foreground">תאריך: {formatDate(quote?.date)}</p>
                </div>
                <div className="text-end">
                  <div className="text-sm text-muted-foreground">{he.quotes.total}</div>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(quote?.total)}</div>
                </div>
              </div>

              <table className="mb-6 w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 text-start">{he.quotes.description}</th>
                    <th className="py-2 text-end">{he.quotes.quantity}</th>
                    <th className="py-2 text-end">{he.quotes.lineTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {quote?.items?.map((it, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{it.description}</td>
                      <td className="py-2 text-end" dir="ltr">{it.quantity} {it.unit}</td>
                      <td className="py-2 text-end">{formatCurrency(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="mb-3 font-semibold">{he.quotes.sign.title}</h3>
              <div className="mb-3">
                <Label>{he.quotes.sign.signerName}</Label>
                <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} />
              </div>
              <Label>{he.quotes.sign.signHere}</Label>
              <canvas
                ref={canvasRef}
                width={500}
                height={160}
                className="w-full touch-none rounded-lg border bg-white"
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerLeave={end}
              />
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
              <div className="mt-4 flex gap-2">
                <Button onClick={submit} disabled={submitting || !signerName.trim()}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {he.quotes.sign.submit}
                </Button>
                <Button variant="outline" onClick={clear}>{he.quotes.sign.clear}</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
