import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSearch } from './GlobalSearch';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function AppLayout() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keyboard shortcuts: Ctrl+K search, Ctrl+N new contact, G+? navigation.
  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate('/contacts?new=1');
        return;
      }
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key.toLowerCase() === 'g') {
        gPressed = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => (gPressed = false), 1000);
        return;
      }
      if (gPressed) {
        const map: Record<string, string> = { d: '/', l: '/contacts', p: '/projects', q: '/quotes', c: '/calendar', s: '/settings' };
        const path = map[e.key.toLowerCase()];
        if (path) {
          navigate(path);
          gPressed = false;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DialogContent className="fixed inset-y-0 end-0 start-auto top-0 h-full max-w-64 translate-x-0 translate-y-0 rounded-none border-0 p-0 rtl:translate-x-0" hideClose>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onOpenSearch={() => setSearchOpen(true)} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
