import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WIDGET_LIST, type WidgetCategory } from './registry';
import { he } from '@/locales/he';
import { Plus } from 'lucide-react';

const CATEGORY_ORDER: WidgetCategory[] = ['kpi', 'lists', 'charts', 'calendar'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: string) => void;
}

export function AddWidgetDialog({ open, onOpenChange, onAdd }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{he.dashboard.addWidgetTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 max-h-[60vh] overflow-y-auto">
          {CATEGORY_ORDER.map((cat) => {
            const widgets = WIDGET_LIST.filter((w) => w.category === cat);
            if (widgets.length === 0) return null;
            return (
              <div key={cat}>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{he.dashboard.categories[cat]}</h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {widgets.map((w) => (
                    <button
                      key={w.type}
                      onClick={() => {
                        onAdd(w.type);
                        onOpenChange(false);
                      }}
                      className="flex items-center gap-2 rounded-lg border p-3 text-start text-sm hover:border-primary hover:bg-secondary"
                    >
                      <Plus className="h-4 w-4 text-primary shrink-0" />
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
