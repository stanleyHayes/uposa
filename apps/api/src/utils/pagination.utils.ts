export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function getPaginationParams(query: { page?: string; limit?: string }): {
  page: number;
  limit: number;
  skip: number;
} {
  // `|| default` also catches NaN (e.g. ?limit=abc). Without it the NaN limit is
  // falsy, the repository skips .limit(), and the whole collection is returned.
  const page = Math.max(1, parseInt(String(query.page ?? ''), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? ''), 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
