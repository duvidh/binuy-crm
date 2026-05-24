import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, User as UserIcon, Menu, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/stores/auth';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks/useNotifications';
import { formatRelative } from '@/lib/format';
import { he } from '@/locales/he';

interface TopbarProps {
  onOpenSearch: () => void;
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSearch, onOpenSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: notif } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const initials = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <header className="flex h-16 items-center gap-3 border-b bg-card px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenSidebar}>
        <Menu className="h-5 w-5" />
      </Button>

      <button
        onClick={onOpenSearch}
        className="flex h-10 flex-1 max-w-md items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground hover:bg-secondary"
      >
        <Search className="h-4 w-4" />
        <span>{he.search.placeholder}</span>
        <kbd className="ms-auto rounded border bg-muted px-1.5 text-xs">Ctrl K</kbd>
      </button>

      <div className="ms-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" title={he.notifications.title}>
              <Bell className="h-5 w-5" />
              {!!notif?.unread && (
                <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {notif.unread > 9 ? '9+' : notif.unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="px-0">{he.notifications.title}</DropdownMenuLabel>
              {!!notif?.unread && (
                <button onClick={() => markAll.mutate()} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> {he.notifications.markAllRead}
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {!notif || notif.notifications.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{he.notifications.empty}</p>
              ) : (
                notif.notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={`flex-col items-start gap-0.5 ${n.read ? 'opacity-60' : ''}`}
                    onClick={() => {
                      if (!n.read) markRead.mutate(n.id);
                      if (n.link) navigate(n.link);
                    }}
                  >
                    <span className="text-sm">{n.message}</span>
                    <span className="text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {initials}
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium leading-tight">{user?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {user?.role && he.roles[user.role]}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <UserIcon className="h-4 w-4" />
              {he.nav.settings}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              {he.nav.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
