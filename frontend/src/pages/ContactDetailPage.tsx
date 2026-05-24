import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  Pencil,
  MessageCircle,
  Phone,
  UserCheck,
  Mail,
  MapPin,
  Plus,
  Share2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ContactFormDialog } from '@/components/contacts/ContactFormDialog';
import { useContact, useContactActivity, useConvertContact } from '@/hooks/useContacts';
import { useQuotes } from '@/hooks/useQuotes';
import { formatCurrency, formatDate, formatDateTime, formatPhone, whatsappLink } from '@/lib/format';
import { leadTypeLabel, leadTypeVariant, quoteStatusLabel, quoteStatusVariant } from '@/lib/contactMeta';
import { he } from '@/locales/he';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'נוצר',
  UPDATE: 'עודכן',
  CONVERT: 'הומר ללקוח',
  DELETE: 'נמחק',
};

export function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id);
  const { data: activity } = useContactActivity(id);
  const { data: quotes } = useQuotes({ contactId: id });
  const convert = useConvertContact();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);

  if (isLoading || !contact) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const isCustomer = contact.status === 'CUSTOMER';
  const f = he.contacts.fields;

  const sharePortal = async () => {
    const res = await api.post(`/contacts/${contact.id}/portal-token`);
    const url = `${window.location.origin}${res.data.portalUrl}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success(`${he.portal.linkCopied}: ${url}`);
  };

  return (
    <div>
      <PageHeader title={contact.fullName}>
        <Button variant="ghost" onClick={() => navigate('/contacts')}><ArrowRight className="h-4 w-4" /> {he.common.back}</Button>
        <a href={whatsappLink(contact.phone)} target="_blank" rel="noreferrer">
          <Button variant="outline" className="text-success"><MessageCircle className="h-4 w-4" /> {he.contacts.whatsapp}</Button>
        </a>
        {!isCustomer && (
          <Button className="bg-accent hover:bg-accent/90" onClick={() => setConfirmConvert(true)}>
            <UserCheck className="h-4 w-4" /> {he.contacts.convert}
          </Button>
        )}
        {isCustomer && (
          <Button variant="outline" onClick={sharePortal}>
            <Share2 className="h-4 w-4" /> {he.portal.share}
          </Button>
        )}
        <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> {he.common.edit}</Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant={leadTypeVariant[contact.leadType]}>{leadTypeLabel(contact.leadType)}</Badge>
        <Badge variant={isCustomer ? 'success' : 'outline'}>{he.contacts.status[contact.status]}</Badge>
        {contact.entityTags?.map((et) => (
          <Badge key={et.id} style={{ backgroundColor: `${et.tag.color}20`, color: et.tag.color }}>{et.tag.name}</Badge>
        ))}
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">{he.contacts.tabs.details}</TabsTrigger>
          <TabsTrigger value="activity">{he.contacts.tabs.activity}</TabsTrigger>
          {isCustomer && <TabsTrigger value="quotes">{he.contacts.tabs.quotes}</TabsTrigger>}
          {isCustomer && <TabsTrigger value="pipeline">{he.contacts.tabs.pipeline}</TabsTrigger>}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="grid grid-cols-1 gap-x-8 gap-y-4 pt-6 sm:grid-cols-2">
              <Field icon={Phone} label={f.phone} value={formatPhone(contact.phone)} ltr />
              <Field icon={Mail} label={f.email} value={contact.email} ltr />
              <Field icon={MapPin} label={f.city} value={contact.city} />
              <Field label={f.address} value={contact.address} />
              <Field label={f.projectType} value={contact.projectType} />
              <Field label={f.budget} value={contact.budget != null ? formatCurrency(contact.budget) : undefined} />
              <Field label={f.areaSqm} value={contact.areaSqm?.toString()} />
              <Field label={f.source} value={contact.source} />
              <Field label={f.taxId} value={contact.taxId} ltr />
              <Field label={f.assignedTo} value={contact.assignedTo?.name} />
              <Field label={f.nextFollowUpAt} value={contact.nextFollowUpAt ? formatDate(contact.nextFollowUpAt) : undefined} />
              <Field label={f.createdAt} value={formatDate(contact.createdAt)} />
              {contact.notes && (
                <div className="sm:col-span-2">
                  <div className="text-sm text-muted-foreground">{f.notes}</div>
                  <p className="mt-1 whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              {!activity || activity.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{he.common.noResults}</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((log: { id: string; action: string; createdAt: string; user?: { name: string } }) => (
                    <li key={log.id} className="flex items-start gap-3 border-s-2 border-primary/30 ps-3">
                      <div>
                        <div className="text-sm font-medium">{ACTION_LABELS[log.action] ?? log.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.user?.name ?? '—'} · {formatDateTime(log.createdAt)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isCustomer && (
          <TabsContent value="quotes">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-3 flex justify-end">
                  <Button size="sm" onClick={() => navigate('/quotes/new')}><Plus className="h-4 w-4" /> {he.quotes.newQuote}</Button>
                </div>
                {!quotes || quotes.data.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{he.quotes.emptyTitle}</p>
                ) : (
                  <ul className="divide-y">
                    {quotes.data.map((q) => (
                      <li key={q.id}>
                        <Link to={`/quotes/${q.id}`} className="flex items-center justify-between py-3 hover:bg-secondary/40 px-2 rounded-md">
                          <span className="font-medium" dir="ltr">{q.quoteNumber}</span>
                          <div className="flex items-center gap-3">
                            <Badge variant={quoteStatusVariant[q.status]}>{quoteStatusLabel(q.status)}</Badge>
                            <span className="font-medium">{formatCurrency(q.total)}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isCustomer && (
          <TabsContent value="pipeline">
            <Card>
              <CardContent className="pt-6">
                {!contact.pipelineEntries || contact.pipelineEntries.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{he.common.noResults}</p>
                ) : (
                  <ol className="flex flex-wrap gap-2">
                    {contact.pipelineEntries.map((e) => (
                      <li key={e.id}>
                        <Badge style={{ backgroundColor: `${e.stage.color}20`, color: e.stage.color ?? undefined }}>{e.stage.name}</Badge>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <ContactFormDialog open={editOpen} onOpenChange={setEditOpen} contact={contact} />
      <ConfirmDialog
        open={confirmConvert}
        onOpenChange={setConfirmConvert}
        title={he.contacts.convertConfirm}
        confirmLabel={he.contacts.convert}
        destructive={false}
        onConfirm={async () => {
          await convert.mutateAsync(contact.id);
          toast.success(he.contacts.converted);
        }}
      />
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon?: typeof Phone;
  label: string;
  value?: string | null;
  ltr?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className="mt-0.5 font-medium" dir={ltr ? 'ltr' : undefined}>{value || '—'}</div>
    </div>
  );
}
