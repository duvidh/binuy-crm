import type { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import type { ListParams } from '../utils/query.js';
import { LeadType, ContactStatus } from '../constants/enums.js';

export interface ContactFilters {
  city?: string;
  projectType?: string;
  leadType?: string;
  status?: string;
  source?: string;
  assignedToId?: string;
  budgetMin?: number;
  budgetMax?: number;
  tagId?: string;
}

export function buildContactWhere(
  params: ListParams,
  filters: ContactFilters,
): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = { deletedAt: null };

  if (params.search) {
    where.OR = [
      { fullName: { contains: params.search } },
      { phone: { contains: params.search } },
      { email: { contains: params.search } },
      { address: { contains: params.search } },
    ];
  }
  if (filters.city) where.city = filters.city;
  if (filters.projectType) where.projectType = filters.projectType;
  if (filters.leadType) where.leadType = filters.leadType;
  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.budgetMin != null || filters.budgetMax != null) {
    where.budget = {};
    if (filters.budgetMin != null) where.budget.gte = filters.budgetMin;
    if (filters.budgetMax != null) where.budget.lte = filters.budgetMax;
  }
  if (filters.tagId) {
    where.entityTags = { some: { tagId: filters.tagId } };
  }
  return where;
}

const SORTABLE = new Set([
  'fullName',
  'phone',
  'city',
  'budget',
  'leadType',
  'status',
  'createdAt',
  'updatedAt',
  'nextFollowUpAt',
]);

export async function listContacts(params: ListParams, filters: ContactFilters) {
  const where = buildContactWhere(params, filters);
  const orderBy: Prisma.ContactOrderByWithRelationInput = SORTABLE.has(params.sortBy ?? '')
    ? { [params.sortBy as string]: params.sortDir }
    : { createdAt: 'desc' };

  const [data, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy,
      skip: params.skip,
      take: params.take,
      include: {
        assignedTo: { select: { id: true, name: true } },
        entityTags: { include: { tag: true } },
        _count: { select: { quotes: true, projects: true, tasks: true } },
      },
    }),
    prisma.contact.count({ where }),
  ]);
  return { data, total };
}

export async function getContact(id: string) {
  return prisma.contact.findFirst({
    where: { id, deletedAt: null },
    include: {
      assignedTo: { select: { id: true, name: true } },
      entityTags: { include: { tag: true } },
      pipelineEntries: { include: { stage: true }, orderBy: { enteredAt: 'desc' } },
      _count: { select: { quotes: true, projects: true, tasks: true, payments: true, documents: true } },
    },
  });
}

export async function convertToCustomer(id: string) {
  const contact = await prisma.contact.update({
    where: { id },
    data: { status: ContactStatus.CUSTOMER, leadType: LeadType.CONVERTED },
  });
  // Seed the pipeline with the first stage if none exists yet.
  const existing = await prisma.contactPipelineEntry.findFirst({ where: { contactId: id } });
  if (!existing) {
    const firstStage = await prisma.pipelineStage.findFirst({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    if (firstStage) {
      await prisma.contactPipelineEntry.create({
        data: { contactId: id, stageId: firstStage.id },
      });
    }
  }
  return contact;
}
