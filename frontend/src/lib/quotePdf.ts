import { formatCurrency, formatDate } from './format';
import type { QuoteItem, CompanySettings } from '@/types';

interface QuotePdfData {
  quoteNumber: string;
  date: string;
  validUntil?: string | null;
  clientName: string;
  items: QuoteItem[];
  vatRate: number;
  discount: number;
  discountType: 'AMOUNT' | 'PERCENT';
  totals: { subtotal: number; discountAmount: number; vatAmount: number; total: number };
  notes?: string;
  company: CompanySettings | null;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// Render an RTL Hebrew quote document and open the browser print dialog
// (Save as PDF). This guarantees correct Hebrew bidi rendering.
export function downloadQuotePdf(data: QuotePdfData) {
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) return;

  const grouped = new Map<string, QuoteItem[]>();
  for (const it of data.items) {
    const key = it.section || '';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(it);
  }

  const rowsHtml = Array.from(grouped.entries())
    .map(([section, items]) => {
      const sectionRow = section
        ? `<tr class="section"><td colspan="5">${esc(section)}</td></tr>`
        : '';
      const itemRows = items
        .map(
          (it) => `<tr>
            <td>${esc(it.description)}</td>
            <td class="num">${esc(it.quantity)}</td>
            <td>${esc(it.unit ?? '')}</td>
            <td class="num">${formatCurrency(it.unitPrice)}</td>
            <td class="num">${formatCurrency((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}</td>
          </tr>`,
        )
        .join('');
      return sectionRow + itemRows;
    })
    .join('');

  const c = data.company;
  const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8" />
<title>הצעת מחיר ${esc(data.quoteNumber)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&display=swap');
  * { font-family: 'Heebo', sans-serif; box-sizing: border-box; }
  body { margin: 0; padding: 40px; color: #1e293b; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  .company h1 { margin: 0; font-size: 22px; color: #2563eb; }
  .company p { margin: 2px 0; font-size: 13px; color: #64748b; }
  .doc-title { text-align: left; }
  .doc-title h2 { margin: 0; font-size: 20px; }
  .doc-title p { margin: 2px 0; font-size: 13px; color: #64748b; }
  .meta { display: flex; gap: 40px; margin-bottom: 20px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #f1f5f9; text-align: right; padding: 8px 10px; font-size: 13px; border-bottom: 2px solid #cbd5e1; }
  td { padding: 8px 10px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
  td.num, th.num { text-align: left; direction: ltr; }
  tr.section td { background: #eff6ff; font-weight: 700; color: #2563eb; }
  .totals { width: 300px; margin-inline-start: auto; font-size: 14px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .grand { border-top: 2px solid #2563eb; font-size: 18px; font-weight: 700; color: #2563eb; padding-top: 10px; }
  .notes { margin-top: 24px; font-size: 13px; color: #475569; white-space: pre-wrap; }
  .sign { margin-top: 50px; display: flex; gap: 60px; font-size: 13px; }
  .sign div { border-top: 1px solid #94a3b8; padding-top: 6px; width: 200px; text-align: center; }
  @media print { body { padding: 20px; } }
</style></head>
<body>
  <div class="header">
    <div class="company">
      <h1>${esc(c?.name ?? 'חברת בנייה')}</h1>
      ${c?.businessId ? `<p>ח.פ ${esc(c.businessId)}</p>` : ''}
      ${c?.address ? `<p>${esc(c.address)}</p>` : ''}
      ${c?.phone ? `<p>טל' ${esc(c.phone)}</p>` : ''}
      ${c?.email ? `<p>${esc(c.email)}</p>` : ''}
    </div>
    <div class="doc-title">
      <h2>הצעת מחיר</h2>
      <p>מספר: ${esc(data.quoteNumber)}</p>
      <p>תאריך: ${formatDate(data.date)}</p>
      ${data.validUntil ? `<p>בתוקף עד: ${formatDate(data.validUntil)}</p>` : ''}
    </div>
  </div>

  <div class="meta"><div><strong>לכבוד:</strong> ${esc(data.clientName)}</div></div>

  <table>
    <thead><tr>
      <th>תיאור</th><th class="num">כמות</th><th>יחידה</th><th class="num">מחיר ליחידה</th><th class="num">סה"כ</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>סה"כ לפני מע"מ</span><span>${formatCurrency(data.totals.subtotal)}</span></div>
    ${data.totals.discountAmount ? `<div class="row"><span>הנחה</span><span>- ${formatCurrency(data.totals.discountAmount)}</span></div>` : ''}
    <div class="row"><span>מע"מ (${data.vatRate}%)</span><span>${formatCurrency(data.totals.vatAmount)}</span></div>
    <div class="row grand"><span>סה"כ לתשלום</span><span>${formatCurrency(data.totals.total)}</span></div>
  </div>

  ${data.notes ? `<div class="notes"><strong>הערות:</strong>\n${esc(data.notes)}</div>` : ''}

  <div class="sign">
    <div>חתימת הלקוח</div>
    <div>חתימת החברה</div>
  </div>

  <script>window.onload = () => { window.print(); };</script>
</body></html>`;

  win.document.write(html);
  win.document.close();
}
