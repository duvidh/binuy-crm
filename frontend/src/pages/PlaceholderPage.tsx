import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { he } from '@/locales/he';

// Sections delivered in later phases (5-8). Routed so navigation never 404s.
export function PlaceholderPage({ titleKey }: { titleKey: keyof typeof he.nav }) {
  return (
    <div>
      <PageHeader title={he.nav[titleKey]} />
      <EmptyState
        icon={Construction}
        title="בקרוב"
        description="מודול זה ייבנה בשלבים הבאים (5-8). ה-MVP כולל לידים/לקוחות, דשבורד והצעות מחיר."
      />
    </div>
  );
}
