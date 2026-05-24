export type UserRole = 'ADMIN' | 'SALES' | 'PROJECT_MANAGER' | 'ACCOUNTANT' | 'VIEWER';
export type ContactStatus = 'LEAD' | 'CUSTOMER';
export type LeadType = 'NEW' | 'COLD' | 'HOT' | 'CONVERTED';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'SIGNED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  twoFactorEnabled?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  entityType: string;
}

export interface EntityTag {
  id: string;
  tagId: string;
  tag: Tag;
}

export interface Contact {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  projectType?: string | null;
  areaSqm?: number | null;
  budget?: number | null;
  leadType: LeadType;
  status: ContactStatus;
  source?: string | null;
  taxId?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  notes?: string | null;
  lastContactAt?: string | null;
  nextFollowUpAt?: string | null;
  createdAt: string;
  updatedAt: string;
  entityTags?: EntityTag[];
  pipelineEntries?: { id: string; stage: PipelineStage; enteredAt: string }[];
  _count?: { quotes: number; projects: number; tasks: number; payments?: number; documents?: number };
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string | null;
}

export interface SettingsListItem {
  id: string;
  listType: string;
  value: string;
  order: number;
  color?: string | null;
  isActive: boolean;
}

export interface QuoteItem {
  id?: string;
  section?: string | null;
  description: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  total?: number;
  notes?: string | null;
  order?: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  contactId: string;
  contact?: Contact | { id: string; fullName: string };
  projectId?: string | null;
  date: string;
  validUntil?: string | null;
  status: QuoteStatus;
  vatRate: number;
  discount: number;
  discountType: 'AMOUNT' | 'PERCENT';
  subtotal: number;
  vatAmount: number;
  total: number;
  notes?: string | null;
  signedAt?: string | null;
  signToken?: string | null;
  items?: QuoteItem[];
  _count?: { items: number };
}

export interface PriceCatalogItem {
  id: string;
  name: string;
  unit?: string | null;
  defaultPrice: number;
  category?: string | null;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export type ProjectStatus = 'PLANNING' | 'APPROVED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: string;
  name: string;
  contactId: string;
  contact?: { id: string; fullName: string; phone?: string };
  address?: string | null;
  city?: string | null;
  projectType?: string | null;
  status: ProjectStatus;
  startDatePlanned?: string | null;
  endDatePlanned?: string | null;
  startDateActual?: string | null;
  endDateActual?: string | null;
  budget?: number | null;
  budgetUsed: number;
  managerId?: string | null;
  manager?: { id: string; name: string } | null;
  notes?: string | null;
  progress: number;
  milestones?: Milestone[];
  permits?: Permit[];
  checklists?: Checklist[];
  siteLogs?: SiteLogEntry[];
  photos?: ProjectPhoto[];
  profitability?: Profitability;
  _count?: { milestones?: number; tasks?: number; quotes?: number; documents?: number };
}

export interface Profitability {
  budget: number;
  revenue: number;
  pending: number;
  expenses: number;
  profit: number;
  margin: number;
  overBudget: boolean;
}

export interface Milestone {
  id: string;
  name: string;
  order: number;
  plannedDate?: string | null;
  actualDate?: string | null;
  progressPct: number;
  status: string;
  assignedToId?: string | null;
}

export interface Permit {
  id: string;
  fileNumber?: string | null;
  gush?: string | null;
  helka?: string | null;
  status: string;
  issuedDate?: string | null;
  expiryDate?: string | null;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

export interface SiteLogEntry {
  id: string;
  date: string;
  workersCount: number;
  workDone?: string | null;
  notes?: string | null;
}

export interface ProjectPhoto {
  id: string;
  filePath: string;
  phase?: string | null;
  caption?: string | null;
  takenAt?: string | null;
}

export interface Payment {
  id: string;
  contactId?: string | null;
  projectId?: string | null;
  contact?: { fullName: string } | null;
  project?: { name: string } | null;
  amount: number;
  date: string;
  dueDate?: string | null;
  method?: string | null;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  invoiceNumber?: string | null;
  notes?: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  field?: string | null;
  phone?: string | null;
  email?: string | null;
  businessId?: string | null;
  rating?: number | null;
  notes?: string | null;
  _count?: { contracts: number; expenses: number };
}

export interface Expense {
  id: string;
  projectId?: string | null;
  supplierId?: string | null;
  supplier?: { name: string } | null;
  project?: { name: string } | null;
  category?: string | null;
  amount: number;
  date: string;
  description?: string | null;
}

export interface CompanySettings {
  id: string;
  name: string;
  businessId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  vatRate: number;
  quoteStartNumber: number;
  exemptDealer: boolean;
}
