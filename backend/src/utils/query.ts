import type { Request } from 'express';

export interface ListParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  search?: string;
  sortBy?: string;
  sortDir: 'asc' | 'desc';
}

export function parseListParams(req: Request, defaultSort = 'createdAt'): ListParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 25));
  const sortBy = (req.query.sortBy as string) || defaultSort;
  const sortDir = (req.query.sortDir as string) === 'asc' ? 'asc' : 'desc';
  const search = (req.query.search as string)?.trim() || undefined;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize, search, sortBy, sortDir };
}

export function paginated<T>(data: T[], total: number, params: ListParams) {
  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.ceil(total / params.pageSize),
    },
  };
}
