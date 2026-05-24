import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg } from '@fullcalendar/core';
import heLocale from '@fullcalendar/core/locales/he';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { useTasks, useUpdateTask, type Task } from '@/hooks/useTasks';
import { he } from '@/locales/he';

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#94a3b8',
  NORMAL: '#2563eb',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

export function CalendarPage() {
  const { data: tasks } = useTasks({ filter: 'all' });
  const update = useUpdateTask();
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>();

  const events = (tasks ?? [])
    .filter((t) => t.dueDate)
    .map((t) => ({
      id: t.id,
      title: t.title,
      start: t.dueDate!,
      backgroundColor: t.status === 'COMPLETED' ? '#10b981' : PRIORITY_COLOR[t.priority],
      borderColor: 'transparent',
      extendedProps: { task: t },
    }));

  const onDateClick = (arg: DateClickArg) => {
    setEditTask(null);
    setDefaultDate(`${arg.dateStr.slice(0, 10)}T09:00`);
    setFormOpen(true);
  };

  const onEventClick = (arg: EventClickArg) => {
    setDefaultDate(undefined);
    setEditTask(arg.event.extendedProps.task as Task);
    setFormOpen(true);
  };

  const onEventDrop = async (arg: EventDropArg) => {
    try {
      await update.mutateAsync({ id: arg.event.id, dueDate: arg.event.start?.toISOString() });
      toast.success(he.common.saved);
    } catch {
      arg.revert();
      toast.error(he.common.error);
    }
  };

  return (
    <div>
      <PageHeader title={he.calendar.title}>
        <Button onClick={() => { setEditTask(null); setDefaultDate(undefined); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> {he.tasks.newTask}
        </Button>
      </PageHeader>

      <Card className="p-4">
        <div dir="rtl" className="crm-calendar">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={heLocale}
            direction="rtl"
            headerToolbar={{ start: 'prev,next today', center: 'title', end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
            buttonText={{ today: he.calendar.today, month: he.calendar.month, week: he.calendar.week, day: he.calendar.day, list: he.calendar.list }}
            events={events}
            editable
            dateClick={onDateClick}
            eventClick={onEventClick}
            eventDrop={onEventDrop}
            height="auto"
            firstDay={0}
          />
        </div>
      </Card>

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editTask} defaultDate={defaultDate} />
    </div>
  );
}
