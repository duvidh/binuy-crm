import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { getProfitability } from '../services/project.service.js';

function dateRange(req: Request) {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().getFullYear(), 0, 1);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  return { from, to };
}

// Sales: signed/accepted quote totals, won vs open counts.
export const sales = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = dateRange(req);
  const quotes = await prisma.quote.findMany({
    where: { deletedAt: null, date: { gte: from, lte: to } },
    select: { total: true, status: true, date: true },
  });
  const won = quotes.filter((q) => q.status === 'ACCEPTED' || q.status === 'SIGNED');
  const wonValue = won.reduce((s, q) => s + q.total, 0);
  const totalValue = quotes.reduce((s, q) => s + q.total, 0);

  // Monthly buckets.
  const byMonth = new Map<string, { quoted: number; won: number }>();
  for (const q of quotes) {
    const key = `${q.date.getMonth() + 1}/${String(q.date.getFullYear()).slice(2)}`;
    const b = byMonth.get(key) ?? { quoted: 0, won: 0 };
    b.quoted += q.total;
    if (q.status === 'ACCEPTED' || q.status === 'SIGNED') b.won += q.total;
    byMonth.set(key, b);
  }

  res.json({
    totalQuotes: quotes.length,
    wonQuotes: won.length,
    totalValue,
    wonValue,
    winRate: quotes.length ? Math.round((won.length / quotes.length) * 100) : 0,
    series: Array.from(byMonth.entries()).map(([month, v]) => ({ month, ...v })),
  });
});

// Lead sources: count, converted, conversion %.
export const leadSources = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = dateRange(req);
  const contacts = await prisma.contact.findMany({
    where: { deletedAt: null, createdAt: { gte: from, lte: to } },
    select: { source: true, status: true, budget: true },
  });
  const map = new Map<string, { count: number; converted: number; value: number }>();
  for (const c of contacts) {
    const key = c.source ?? 'ללא מקור';
    const b = map.get(key) ?? { count: 0, converted: 0, value: 0 };
    b.count++;
    if (c.status === 'CUSTOMER') {
      b.converted++;
      b.value += c.budget ?? 0;
    }
    map.set(key, b);
  }
  res.json(
    Array.from(map.entries()).map(([source, v]) => ({
      source,
      ...v,
      conversionRate: v.count ? Math.round((v.converted / v.count) * 100) : 0,
    })),
  );
});

// Profitability per active project.
export const profitabilityReport = asyncHandler(async (_req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    take: 100,
  });
  const rows = await Promise.all(
    projects.map(async (p) => ({ id: p.id, name: p.name, ...(await getProfitability(p.id)) })),
  );
  res.json(rows.filter((r) => r.revenue > 0 || r.expenses > 0 || r.budget > 0));
});

// Performance per salesperson.
export const salesByRep = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = dateRange(req);
  const users = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true, name: true } });
  const rows = await Promise.all(
    users.map(async (u) => {
      const [leads, customers] = await Promise.all([
        prisma.contact.count({ where: { deletedAt: null, assignedToId: u.id, createdAt: { gte: from, lte: to } } }),
        prisma.contact.count({ where: { deletedAt: null, assignedToId: u.id, status: 'CUSTOMER' } }),
      ]);
      return { id: u.id, name: u.name, leads, customers, conversionRate: leads ? Math.round((customers / leads) * 100) : 0 };
    }),
  );
  res.json(rows.filter((r) => r.leads > 0));
});
