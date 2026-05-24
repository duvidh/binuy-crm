# CRM לחברת בנייה · Construction CRM (Hebrew / RTL)

מערכת CRM מלאה בעברית (RTL) לחברות בנייה ושיפוצים — ניהול לידים ולקוחות, פרויקטים, הצעות מחיר, תשלומים, משימות ודשבורד מותאם אישית.

A production-oriented CRM for Israeli construction companies. Full Hebrew UI, RTL layout, shekel currency, Israeli phone/ID validation, dynamic dashboard, quote builder with PDF + digital signature.

---

## Tech Stack

**Frontend:** React 18 + TypeScript + Vite · Tailwind CSS (RTL) · Radix UI primitives (shadcn-style) · React Router v6 · TanStack Query + Zustand · React Hook Form + Zod · dnd-kit · react-grid-layout · TanStack Table · Recharts · Lucide · date-fns (he locale) · sonner

**Backend:** Node.js + Express (TypeScript) · Prisma ORM · JWT (access + refresh) + bcrypt · Helmet · rate limiting · Zod validation · Pino logging · node-cron

**Database:** SQLite by default (zero-config dev). Configurable to PostgreSQL via `DATABASE_URL`.

---

## Quick Start

```bash
# 1. Install everything (root + both workspaces)
npm install

# 2. Create the database + seed sample data
npm run db:migrate     # or: npm run db:push -w backend
npm run db:seed

# 3. Run both backend + frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api
- Health check: http://localhost:4000/api/health

> First-time shortcut: `npm run setup` runs install + migrate + seed in one go.

### Default credentials

| Role | Email | Password |
|------|-------|----------|
| מנהל (Admin) | `admin@crm.local` | `Admin123!` |
| איש מכירות (Sales) | `sales@crm.local` | `Sales123!` |

Seeded data: 10 contacts (leads + customers), 3 projects, 2 quotes, a price catalog, dropdown lists, pipeline stages, checklist templates, and tags.

---

## Environment Variables

Copy the examples and adjust as needed:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # optional — dev proxy works without it
```

**backend/.env**

| Var | Default | Notes |
|-----|---------|-------|
| `DATABASE_URL` | `file:./dev.db` | SQLite file, or a `postgresql://...` URL |
| `PORT` | `4000` | API port |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev values | **change in production** |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | `15m` / `7d` | token lifetimes |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS origin |
| `UPLOAD_DIR` | `./uploads` | file storage path |

**frontend/.env** — `VITE_API_URL` (leave empty to use the Vite dev proxy `/api → backend`).

---

## npm Scripts

Run from the repo root:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend + frontend together (concurrently) |
| `npm run build` | Build both for production |
| `npm run start` | Start the built backend |
| `npm run db:migrate` | Create/apply the Prisma migration |
| `npm run db:seed` | Seed sample data |
| `npm run db:reset` | Reset the database (destructive) |

---

## What's Implemented (All 8 Phases)

**Phase 1 — Foundation**
- Monorepo (npm workspaces), full Prisma schema (all spec models incl. section 9)
- Express API: Helmet, CORS, rate limiting, error handler, `/api/health`
- Auth: JWT access (15m) + httpOnly refresh cookie (7d), bcrypt cost 12, account lockout after 5 failed attempts, password policy
- RBAC middleware (ADMIN / SALES / PROJECT_MANAGER / ACCOUNTANT / VIEWER)
- Seed script, activity logging on mutations
- RTL React shell: login, protected routes, sidebar/topbar, global search (Ctrl+K), keyboard shortcuts

**Phase 2 — Contacts (Leads & Customers)**
- Server-side CRUD, pagination, filtering, sorting, search
- TanStack Table list view (sortable, selectable) + Kanban (drag between lead types)
- Contact form with Israeli phone + ת.ז/ח.פ checksum validation
- Inline "+ הוסף" combobox for city / project-type / source
- Detail page with tabs (details, activity, quotes, pipeline)
- Convert-to-customer, WhatsApp click-to-chat, tags, bulk actions, CSV export

**Phase 3 — Dashboard**
- Per-user layout (saved to DB, debounced), widget registry, role-based defaults
- 12-column drag/drop/resize grid (react-grid-layout), edit/view mode, add-widget gallery
- 16 widgets (KPIs, lists, charts, funnel)

**Phase 4 — Quotes & Invoices**
- Quote builder with sections, line items, live totals (subtotal/discount/VAT)
- Auto-numbering `QT-{YEAR}-{SEQ}`, internal price catalog
- PDF export, quote templates (duplicate), tokenized public sign flow (`/quote/sign/:token`) with canvas signature
- Invoice model (חשבונית מס / קבלה / חשבונית מס-קבלה, עוסק פטור, ניכוי מס במקור)

**Phase 5 — Projects**
- CRUD with card view + detail page tabs: overview, milestones (with progress), permits (30-day expiry warning), template-based checklists, payments, expenses, before/during/after photo gallery, site log (יומן עבודה)
- Profitability (revenue − expenses, margin %) auto-computed; over-budget warning

**Phase 6 — Financials**
- Payments tracking (paid/pending/overdue); project `budgetUsed` recalculated from paid payments
- Aging report (0-30 / 31-60 / 61-90 / 90+), cash-flow forecast (30/60/90d)
- Suppliers with star ratings; project expenses linked to suppliers

**Phase 7 — Calendar, Tasks & Notifications**
- Tasks with Today/Week/Overdue/All filters, priority, type, contact/project links, complete toggle
- FullCalendar (Hebrew, RTL, month/week/day/agenda), click-to-create, drag-to-reschedule
- Notification bell + unread count; node-cron scheduler (5 min) for due/overdue tasks, expiring permits, overdue payments
- Automation engine: rules with triggers (lead created, lead idle, quote accepted, project status changed, payment overdue) → actions (create task, assign, notify, queue message); managed in Settings

**Phase 8 — Settings, Reports & Polish**
- Reports: sales (chart), lead-source ROI, project profitability, sales-by-rep — with date range + CSV export
- Audit log viewer (admin), message templates with `{{variable}}` extraction, soft-delete trash with 30-day restore, JSON data backup
- Client portal (public `/portal/:token`) — customer sees their quotes, projects, payments
- Route-level code splitting (React.lazy), loading skeletons, toasts, confirm dialogs, keyboard shortcuts, mobile-responsive

---

## Engineering Notes

- **Enums on SQLite:** SQLite has no native enums or JSON type, so "enum" fields are stored as strings and validated against shared constants (`backend/src/constants/enums.ts`) via Zod at the API boundary. JSON payloads (dashboard layout, etc.) are stored as text. Switching `provider` to `postgresql` in `schema.prisma` is the only change needed to move to real enums later.
- **Quote PDF:** generated as an RTL Hebrew print document (browser "Save as PDF") rather than `@react-pdf/renderer`, which lacks reliable bidirectional (Hebrew) text shaping. This produces correct Hebrew output with zero rendering surprises.
- **shadcn/ui:** UI primitives are hand-written in the shadcn style (Radix + class-variance-authority) under `frontend/src/components/ui` rather than installed via the interactive CLI.
- **RTL:** `dir="rtl"` is set globally; logical Tailwind properties (`ps`/`pe`/`ms`/`me`) are used throughout. The dashboard grid runs LTR internally (react-grid-layout requirement) with widget content flipped back to RTL.

---

## Project Structure

```
backend/   Express API, Prisma schema + seed, controllers/services/routes
frontend/  React app: components (ui/layout/dashboard/contacts/quotes), pages, hooks, lib, locales
```
