import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useContactsKanban, useUpdateContact } from '@/hooks/useContacts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPhone } from '@/lib/format';
import { he } from '@/locales/he';
import type { Contact, LeadType } from '@/types';

const COLUMNS: { key: LeadType; label: string }[] = [
  { key: 'NEW', label: he.contacts.leadType.NEW },
  { key: 'HOT', label: he.contacts.leadType.HOT },
  { key: 'COLD', label: he.contacts.leadType.COLD },
  { key: 'CONVERTED', label: he.contacts.leadType.CONVERTED },
];

function Card({ contact }: { contact: Contact }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: contact.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/contacts/${contact.id}`)}
      className={`cursor-grab rounded-lg border bg-card p-3 shadow-sm hover:shadow ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="font-medium">{contact.fullName}</div>
      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground" dir="ltr">
        <Phone className="h-3 w-3" /> {formatPhone(contact.phone)}
      </div>
      {contact.city && <div className="mt-1 text-xs text-muted-foreground">{contact.city}</div>}
      {contact.budget != null && (
        <div className="mt-2 text-sm font-medium text-primary">{formatCurrency(contact.budget)}</div>
      )}
    </div>
  );
}

function Column({ col, contacts }: { col: (typeof COLUMNS)[number]; contacts: Contact[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-semibold">{col.label}</span>
        <Badge variant="secondary">{contacts.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[60vh] flex-col gap-2 rounded-lg p-2 transition-colors ${isOver ? 'bg-primary/5 ring-2 ring-primary/30' : 'bg-muted/40'}`}
      >
        {contacts.map((c) => (
          <Card key={c.id} contact={c} />
        ))}
      </div>
    </div>
  );
}

export function ContactsKanban() {
  const { data, isLoading } = useContactsKanban();
  const updateContact = useUpdateContact();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byColumn = useMemo(() => {
    const map: Record<string, Contact[]> = { NEW: [], HOT: [], COLD: [], CONVERTED: [] };
    for (const c of data ?? []) (map[c.leadType] ??= []).push(c);
    return map;
  }, [data]);

  const active = data?.find((c) => c.id === activeId);

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const id = e.active.id as string;
    const target = e.over?.id as LeadType | undefined;
    const contact = data?.find((c) => c.id === id);
    if (!target || !contact || contact.leadType === target) return;
    try {
      await updateContact.mutateAsync({ id, leadType: target });
      toast.success(he.common.saved);
    } catch {
      toast.error(he.common.error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {COLUMNS.map((c) => (
          <Skeleton key={c.key} className="h-[60vh] w-72" />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column key={col.key} col={col} contacts={byColumn[col.key] ?? []} />
        ))}
      </div>
      <DragOverlay>{active ? <Card contact={active} /> : null}</DragOverlay>
    </DndContext>
  );
}
