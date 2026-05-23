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
