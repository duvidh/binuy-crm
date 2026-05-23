import { prisma } from '../utils/prisma.js';
import { ContactStatus, LeadType, PaymentStatus } from '../constants/enums.js';

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// One aggregate call powering all dashboard KPI/list/chart widgets.
export async function getDashboardStats() {
  const monthStart = startOfMonth();
  const now = new Date();

  const [
    leadsNew,
    leadsHot,
    leadsCold,
    customersThisMonth,
    convertedThisMonth,
    totalLeadsThisMonth,
    activeProjects,
    pendingQuotes,
    paidThisMonthAgg,
    overduePaymentsAgg,
    openTasks,
    overdueTasks,
    pipelineBudgetAgg,
    cityGroups,
    typeGroups,
  ] = await Promise.all([
    prisma.contact.count({ where: { deletedAt: null, status: ContactStatus.LEAD, leadType: LeadType.NEW } }),
    prisma.contact.count({ where: { deletedAt: null, status: ContactStatus.LEAD, leadType: LeadType.HOT } }),
    prisma.contact.count({ where: { deletedAt: null, status: ContactStatus.LEAD, leadType: LeadType.COLD } }),
    prisma.contact.count({ where: { deletedAt: null, status: ContactStatus.CUSTOMER, updatedAt: { gte: monthStart } } }),
    prisma.contact.count({ where: { deletedAt: null, leadType: LeadType.CONVERTED, updatedAt: { gte: monthStart } } }),
    prisma.contact.count({ where: { deletedAt: null, createdAt: { gte: monthStart } } }),
    prisma.project.count({ where: { deletedAt: null, status: { in: ['APPROVED', 'IN_PROGRESS'] } } }),
    prisma.quote.findMany({
      where: { deletedAt: null, status: { in: ['SENT', 'DRAFT'] } },
      include: { contact: { select: { fullName: true } } },
      orderBy: { date: 'desc' },
      take: 8,
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { deletedAt: null, status: PaymentStatus.PAID, date: { gte: monthStart } } }),
    prisma.payment.findMany({ where: { deletedAt: null, status: PaymentStatus.OVERDUE }, take: 50 }),
    prisma.task.findMany({
      where: { deletedAt: null, status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { gte: new Date(now.toDateString()) } },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: { contact: { select: { fullName: true } } },
    }),
    prisma.task.findMany({
      where: { deletedAt: null, status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: now } },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: { contact: { select: { fullName: true } } },
    }),
    prisma.contact.aggregate({ _sum: { budget: true }, where: { deletedAt: null, status: ContactStatus.LEAD } }),
    prisma.contact.groupBy({ by: ['city'], where: { deletedAt: null, city: { not: null } }, _count: true }),
    prisma.contact.groupBy({ by: ['projectType'], where: { deletedAt: null, projectType: { not: null } }, _count: true }),
  ]);

  const totalLeads = await prisma.contact.count({ where: { deletedAt: null } });
  const totalCustomers = await prisma.contact.count({ where: { deletedAt: null, status: ContactStatus.CUSTOMER } });
  const conversionRate = totalLeads > 0 ? Math.round((totalCustomers / totalLeads) * 100) : 0;

  const projects = await prisma.project.findMany({
    where: { deletedAt: null, status: { in: ['APPROVED', 'IN_PROGRESS', 'PLANNING'] } },
    select: { id: true, name: true, status: true, progress: true, contact: { select: { fullName: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 8,
  });

  return {
    kpis: {
      leadsNew,
      leadsHot,
      leadsCold,
      customersThisMonth,
      convertedThisMonth,
      conversionRate,
      activeProjects,
      paidThisMonth: paidThisMonthAgg._sum.amount ?? 0,
      pipelineBudget: pipelineBudgetAgg._sum.budget ?? 0,
      monthlyConversionRate: totalLeadsThisMonth > 0 ? Math.round((convertedThisMonth / totalLeadsThisMonth) * 100) : 0,
    },
    pendingQuotes,
    overduePayments: overduePaymentsAgg,
    openTasks,
    overdueTasks,
    activeProjectsList: projects,
    leadsByCity: cityGroups.map((g) => ({ name: g.city ?? '—', value: g._count })),
    leadsByType: typeGroups.map((g) => ({ name: g.projectType ?? '—', value: g._count })),
  };
}

// Monthly revenue series for the revenue line chart.
export async function getRevenueSeries(months: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const payments = await prisma.payment.findMany({
    where: { deletedAt: null, status: PaymentStatus.PAID, date: { gte: start } },
    select: { amount: true, date: true },
  });
  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    buckets.set(`${d.getFullYear()}-${d.getMonth() + 1}`, 0);
  }
  for (const p of payments) {
    const key = `${p.date.getFullYear()}-${p.date.getMonth() + 1}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + p.amount);
  }
  return Array.from(buckets.entries()).map(([key, value]) => {
    const [y, m] = key.split('-');
    return { month: `${m}/${y.slice(2)}`, value };
  });
}
