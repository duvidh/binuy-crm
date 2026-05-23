import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  HardHat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { he } from '@/locales/he';

const navItems = [
  { to: '/', label: he.nav.dashboard, icon: LayoutDashboard, end: true },
  { to: '/contacts', label: he.nav.contacts, icon: Users },
  { to: '/projects', label: he.nav.projects, icon: Building2 },
  { to: '/quotes', label: he.nav.quotes, icon: FileText },
  { to: '/calendar', label: he.nav.calendar, icon: Calendar },
  { to: '/tasks', label: he.nav.tasks, icon: CheckSquare },
  { to: '/reports', label: he.nav.reports, icon: BarChart3 },
  { to: '/settings', label: he.nav.settings, icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-64 flex-col border-e bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <HardHat className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold leading-tight">{he.app.name}</div>
          <div className="text-xs text-muted-foreground">{he.app.tagline}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
