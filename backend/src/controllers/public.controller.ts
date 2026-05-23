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
