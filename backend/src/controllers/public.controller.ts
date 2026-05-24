import type { Request, Response } from 'express';
import { asyncHandler, notFound, badRequest } from '../utils/errors.js';
import { prisma } from '../utils/prisma.js';
import { signSchema } from '../validators/quote.validators.js';
import { logActivity } from '../services/activity.service.js';

// Public view of a quote via its sign token.
export const getQuoteByToken = asyncHandler(async (req: Request, res: Response) => {
  const quote = await prisma.quote.findFirst({
    where: { signToken: req.params.token, deletedAt: null },
    include: { items: { orderBy: { order: 'asc' } }, contact: { select: { fullName: true } } },
  });
  if (!quote) throw notFound('ההצעה לא נמצאה או שהקישור פג תוקף');
  if (quote.signTokenExpiresAt && quote.signTokenExpiresAt < new Date()) {
    throw badRequest('הקישור פג תוקף');
  }
  const company = await prisma.companySettings.findUnique({ where: { id: 'default' } });
  res.json({ quote, company });
});

// Client portal: read-only view of a customer's quotes, projects, payments.
export const getPortal = asyncHandler(async (req: Request, res: Response) => {
  const tokenRow = await prisma.clientPortalToken.findUnique({ where: { token: req.params.token } });
  if (!tokenRow || (tokenRow.expiresAt && tokenRow.expiresAt < new Date())) {
    throw notFound('הקישור לא נמצא או פג תוקף');
  }
  await prisma.clientPortalToken.update({ where: { id: tokenRow.id }, data: { lastUsed: new Date() } });
  const [contact, company, quotes, projects, payments] = await Promise.all([
    prisma.contact.findUnique({ where: { id: tokenRow.contactId }, select: { id: true, fullName: true, phone: true } }),
    prisma.companySettings.findUnique({ where: { id: 'default' } }),
    prisma.quote.findMany({ where: { contactId: tokenRow.contactId, deletedAt: null }, select: { id: true, quoteNumber: true, total: true, status: true, date: true } }),
    prisma.project.findMany({ where: { contactId: tokenRow.contactId, deletedAt: null }, select: { id: true, name: true, status: true, progress: true } }),
    prisma.payment.findMany({ where: { contactId: tokenRow.contactId, deletedAt: null }, select: { id: true, amount: true, status: true, dueDate: true } }),
  ]);
  res.json({ contact, company, quotes, projects, payments });
});

export const signQuote = asyncHandler(async (req: Request, res: Response) => {
  const { signatureData, signerName } = signSchema.parse(req.body);
  const quote = await prisma.quote.findFirst({ where: { signToken: req.params.token, deletedAt: null } });
  if (!quote) throw notFound('ההצעה לא נמצאה');
  if (quote.signTokenExpiresAt && quote.signTokenExpiresAt < new Date()) {
    throw badRequest('הקישור פג תוקף');
  }
  if (quote.signedAt) throw badRequest('ההצעה כבר נחתמה');

  const updated = await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: 'SIGNED',
      signedAt: new Date(),
      signatureData,
      notes: quote.notes ? `${quote.notes}\nנחתם ע"י: ${signerName}` : `נחתם ע"י: ${signerName}`,
    },
  });
  logActivity({ entityType: 'Quote', entityId: quote.id, action: 'SIGNED', details: { signerName } });
  res.json({ ok: true, status: updated.status });
});
