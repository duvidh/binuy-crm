import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/stores/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { he } from '@/locales/he';

// Code-split heavier routes to keep the initial bundle small.
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ContactsPage = lazy(() => import('@/pages/ContactsPage').then((m) => ({ default: m.ContactsPage })));
const ContactDetailPage = lazy(() => import('@/pages/ContactDetailPage').then((m) => ({ default: m.ContactDetailPage })));
const QuotesPage = lazy(() => import('@/pages/QuotesPage').then((m) => ({ default: m.QuotesPage })));
const QuoteEditorPage = lazy(() => import('@/pages/QuoteEditorPage').then((m) => ({ default: m.QuoteEditorPage })));
const QuoteSignPage = lazy(() => import('@/pages/QuoteSignPage').then((m) => ({ default: m.QuoteSignPage })));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })));
const FinancePage = lazy(() => import('@/pages/FinancePage').then((m) => ({ default: m.FinancePage })));
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ClientPortalPage = lazy(() => import('@/pages/ClientPortalPage').then((m) => ({ default: m.ClientPortalPage })));

function Loading() {
  return <div className="flex h-full min-h-[50vh] items-center justify-center text-muted-foreground">{he.common.loading}</div>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  if (!initialized) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">{he.common.loading}</div>;
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/quote/sign/:token" element={<QuoteSignPage />} />
        <Route path="/portal/:token" element={<ClientPortalPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="quotes/new" element={<QuoteEditorPage />} />
          <Route path="quotes/:id" element={<QuoteEditorPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
