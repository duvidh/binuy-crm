import { useEffect, useMemo, useRef, useState } from 'react';
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout';
import { toast } from 'sonner';
import { Pencil, Eye, Plus, X, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { AddWidgetDialog } from '@/components/dashboard/AddWidgetDialog';
import { WIDGET_REGISTRY } from '@/components/dashboard/registry';
import { useDashboardLayout, useSaveLayout, type WidgetInstance } from '@/hooks/useDashboard';
import { useAuth } from '@/stores/auth';
import { he } from '@/locales/he';
import { LayoutDashboard } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

export function DashboardPage() {
  const user = useAuth((s) => s.user);
  const { data, isLoading } = useDashboardLayout();
  const saveLayout = useSaveLayout();
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (data?.widgets) setWidgets(data.widgets);
  }, [data]);

  // Debounced persistence (500ms) after layout changes.
  const persist = (next: WidgetInstance[]) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveLayout.mutate(next);
    }, 500);
  };

  const layouts = useMemo(
    () => ({ lg: widgets.map((w) => ({ i: w.i, x: w.x, y: w.y, w: w.w, h: w.h, minW: 2, minH: 2 })) }),
    [widgets],
  );

  const onLayoutChange = (layout: Layout[]) => {
    if (!editMode) return;
    const next = widgets.map((w) => {
      const l = layout.find((item) => item.i === w.i);
      return l ? { ...w, x: l.x, y: l.y, w: l.w, h: l.h } : w;
    });
    setWidgets(next);
    persist(next);
  };

  const addWidget = (type: string) => {
    const meta = WIDGET_REGISTRY[type];
    if (!meta) return;
    const next: WidgetInstance = {
      i: `${type}-${Date.now()}`,
      type,
      x: 0,
      y: Infinity,
      w: meta.defaultSize.w,
      h: meta.defaultSize.h,
    };
    const updated = [...widgets, next];
    setWidgets(updated);
    persist(updated);
  };

  const removeWidget = (i: string) => {
    const updated = widgets.filter((w) => w.i !== i);
    setWidgets(updated);
    persist(updated);
  };

  const resetLayout = () => {
    saveLayout.mutate([], {
      onSuccess: () => {
        toast.success(he.dashboard.layoutSaved);
        window.location.reload();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Card key={i} className="h-40 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`${he.dashboard.title} · ${user?.name ?? ''}`}>
        {editMode && (
          <>
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> {he.dashboard.addWidget}
            </Button>
            <Button variant="ghost" onClick={resetLayout}>
              <RotateCcw className="h-4 w-4" /> {he.dashboard.reset}
            </Button>
          </>
        )}
        <Button variant={editMode ? 'default' : 'outline'} onClick={() => setEditMode((v) => !v)}>
          {editMode ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editMode ? he.dashboard.viewMode : he.dashboard.editMode}
        </Button>
      </PageHeader>

      {widgets.length === 0 ? (
        <EmptyState icon={LayoutDashboard} title={he.dashboard.emptyWidgets} actionLabel={he.dashboard.addWidget} onAction={() => { setEditMode(true); setAddOpen(true); }} />
      ) : (
        // react-grid-layout computes positions LTR; keep the grid LTR and flip
        // widget content back to RTL so Hebrew renders correctly.
        <div dir="ltr">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 996, md: 768, sm: 480, xs: 0 }}
            cols={{ lg: 12, md: 12, sm: 6, xs: 2 }}
            rowHeight={56}
            margin={[16, 16]}
            isDraggable={editMode}
            isResizable={editMode}
            draggableHandle=".widget-drag-handle"
            onLayoutChange={onLayoutChange}
          >
            {widgets.map((w) => {
              const meta = WIDGET_REGISTRY[w.type];
              const Comp = meta?.component;
              return (
                <div key={w.i} dir="rtl">
                  <Card className={`relative flex h-full flex-col overflow-hidden p-3 ${editMode ? 'ring-2 ring-primary/20' : ''}`}>
                    <div className={`mb-1 flex items-center justify-between ${editMode ? 'widget-drag-handle cursor-move' : ''}`}>
                      <span className="text-xs font-medium text-muted-foreground truncate">{meta?.name}</span>
                      {editMode && (
                        <button onClick={() => removeWidget(w.i)} className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="min-h-0 flex-1">{Comp ? <Comp /> : <div className="text-sm text-muted-foreground">Unknown widget</div>}</div>
                  </Card>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>
      )}

      <AddWidgetDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addWidget} />
    </div>
  );
}
