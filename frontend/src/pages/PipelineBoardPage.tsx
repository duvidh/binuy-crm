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
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { GitBranch } from 'lucide-react';
import { useContactsPipeline, useMoveContactStage, type PipelineContact } from '@/hooks/useContacts';
import { usePipelineStages } from '@/hooks/useSettings';
import { formatCurrency, formatPhone } from '@/lib/format';
import { apiErrorMessage } from '@/lib/api';
import { he } from '@/locales/he';

const UNASSIGNED = 'unassigned';

function Card({ contact }: { contact: PipelineContact }) {
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
      {contact.budget != null && (
        <div className="mt-2 text-sm font-medium text-primary">{formatCurrency(contact.budget)}</div>
      )}
    </div>
  );
}

function Column({
  id,
  label,
  color,
  contacts,
  droppable,
}: {
  id: string;
  label: string;
  color?: string | null;
  contacts: PipelineContact[];
  droppable: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !droppable });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-2 font-semibold">
          {color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
          {label}
        </span>
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

export function PipelineBoardPage() {
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: contacts, isLoading } = useContactsPipeline();
  const move = useMoveContactStage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStage = useMemo(() => {
    const map: Record<string, PipelineContact[]> = { [UNASSIGNED]: [] };
    for (const s of stages ?? []) map[s.id] = [];
    for (const c of contacts ?? []) (map[c.stageId ?? UNASSIGNED] ??= []).push(c);
    return map;
  }, [contacts, stages]);

  const active = contacts?.find((c) => c.id === activeId);

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const id = e.active.id as string;
    const target = e.over?.id as string | undefined;
    const contact = contacts?.find((c) => c.id === id);
    if (!target || target === UNASSIGNED || !contact || contact.stageId === target) return;
    try {
      await move.mutateAsync({ id, stageId: target });
      toast.success(he.common.saved);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (isLoading || stagesLoading) {
    return (
      <div>
        <PageHeader title={he.nav.pipeline} />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[60vh] w-72" />)}
        </div>
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <div>
        <PageHeader title={he.nav.pipeline} />
        <EmptyState icon={GitBranch} title={he.common.noResults} />
      </div>
    );
  }

  const unassigned = byStage[UNASSIGNED] ?? [];

  return (
    <div>
      <PageHeader title={he.nav.pipeline} />
      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((s) => (
            <Column key={s.id} id={s.id} label={s.name} color={s.color} contacts={byStage[s.id] ?? []} droppable />
          ))}
          {unassigned.length > 0 && (
            <Column id={UNASSIGNED} label={he.common.noResults} contacts={unassigned} droppable={false} />
          )}
        </div>
        <DragOverlay>{active ? <Card contact={active} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
