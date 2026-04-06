import { Response } from 'express';
import { PaginationMeta } from './pagination.utils';

export function successResponse(
  res: Response,
  message: string,
  data?: unknown,
  statusCode = 200,
  meta?: PaginationMeta
): Response {
  const body: Record<string, unknown> = {
    success: true,
    message,
  };
  if (data !== undefined) body.data = data;
  if (meta) body.pagination = meta;
  return res.status(statusCode).json(body);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: unknown
): Response {
  const body: Record<string, unknown> = {
    success: false,
    message,
  };
  if (errors !== undefined) body.errors = errors;
  return res.status(statusCode).json(body);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(title: string): string {
  const base = generateSlug(title);
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}
