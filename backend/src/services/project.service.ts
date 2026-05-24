import { prisma } from '../utils/prisma.js';
import { PaymentStatus } from '../constants/enums.js';

// Recompute budgetUsed from the sum of paid payments on the project.
export async function recomputeBudgetUsed(projectId: string) {
  const agg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { projectId, deletedAt: null, status: PaymentStatus.PAID },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { budgetUsed: agg._sum.amount ?? 0 },
  });
}

// Revenue (paid) − expenses = gross profit, with margin %.
export async function getProfitability(projectId: string) {
  const [paidAgg, pendingAgg, expenseAgg, project] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { projectId, deletedAt: null, status: PaymentStatus.PAID } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { projectId, deletedAt: null, status: { not: PaymentStatus.PAID } } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { projectId, deletedAt: null } }),
    prisma.project.findUnique({ where: { id: projectId }, select: { budget: true } }),
  ]);
  const revenue = paidAgg._sum.amount ?? 0;
  const pending = pendingAgg._sum.amount ?? 0;
  const expenses = expenseAgg._sum.amount ?? 0;
  const profit = revenue - expenses;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const budget = project?.budget ?? 0;
  return {
    budget,
    revenue,
    pending,
    expenses,
    profit,
    margin,
    overBudget: budget > 0 && expenses > budget,
  };
}
