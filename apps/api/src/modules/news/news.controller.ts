import { Request, Response } from 'express';
import { createNewsSchema, updateNewsSchema } from './news.validation';
import { listNews, listNewsAdmin, getNewsBySlug, getNewsById, createNews, updateNews, deleteNews } from './news.service';
import { successResponse, errorResponse } from '../../utils/response.utils';
import { uploadToCloudinary } from '../../utils/cloudinary.utils';

function parseFormDataBody(body: Record<string, unknown>): Record<string, unknown> {
  const result = { ...body };
  if (typeof result.isFeatured === 'string') {
    result.isFeatured = result.isFeatured === 'true';
  }
  if (typeof result.isPublished === 'string') {
    result.isPublished = result.isPublished === 'true';
  }
  return result;
}

export async function listNewsHandler(req: Request, res: Response): Promise<void> {
  const result = await listNews(req.query as Record<string, string | undefined>);
  successResponse(res, 'News retrieved', result.data, 200, result.meta);
}

export async function adminListNewsHandler(req: Request, res: Response): Promise<void> {
  const result = await listNewsAdmin(req.query as Record<string, string | undefined>);
  successResponse(res, 'News retrieved', result.data, 200, result.meta);
}

export async function getNewsBySlugHandler(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;
  const article = await getNewsBySlug(slug);
  successResponse(res, 'Article retrieved', article);
}

export async function adminGetNewsByIdHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const article = await getNewsById(id);
  successResponse(res, 'Article retrieved', article);
}

export async function createNewsHandler(req: Request, res: Response): Promise<void> {
  if (!req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const body = parseFormDataBody(req.body);
  const parsed = createNewsSchema.parse({ body });
  const imageUrl = req.file ? await uploadToCloudinary(req.file, 'news') : undefined;
  const article = await createNews(req.admin.id, parsed.body, imageUrl);
  successResponse(res, 'Article created successfully', article, 201);
}

export async function updateNewsHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const body = parseFormDataBody(req.body);
  const parsed = updateNewsSchema.parse({ body });
  const imageUrl = req.file ? await uploadToCloudinary(req.file, 'news') : undefined;
  const article = await updateNews(id, parsed.body, imageUrl);
  successResponse(res, 'Article updated successfully', article);
}

export async function deleteNewsHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await deleteNews(id);
  successResponse(res, result.message);
}
