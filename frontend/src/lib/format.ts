import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export function formatCurrency(value?: number | null): string {
  if (value == null) return '₪ 0';
  const hasDecimals = value % 1 !== 0;
  return `₪ ${value.toLocaleString('he-IL', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value?: number | null): string {
  if (value == null) return '0';
  return value.toLocaleString('he-IL');
}

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  return typeof value === 'string' ? parseISO(value) : value;
}

export function formatDate(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? format(d, 'dd/MM/yyyy', { locale: he }) : '—';
}

export function formatDateTime(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? format(d, 'dd/MM/yyyy HH:mm', { locale: he }) : '—';
}

export function formatRelative(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { locale: he, addSuffix: true }) : '—';
}

// 0541234567 -> 054-123-4567
export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  return phone;
}

export function whatsappLink(phone?: string | null): string {
  if (!phone) return '#';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '972' + digits.slice(1);
  return `https://wa.me/${digits}`;
}
