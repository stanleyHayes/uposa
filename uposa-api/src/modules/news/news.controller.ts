import { Request, Response } from 'express';
import { createNewsSchema, updateNewsSchema } from './news.validation';
import { listNews, getNewsBySlug, createNews, updateNews, deleteNews } from './news.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export async function listNewsHandler(req: Request, res: Response): Promise<void> {
  const result = await listNews(req.query as Record<string, string | undefined>);
  successResponse(res, 'News retrieved', result.data, 200, result.meta);
}

export async function getNewsBySlugHandler(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;
  const article = await getNewsBySlug(slug);
  successResponse(res, 'Article retrieved', article);
}

export async function createNewsHandler(req: Request, res: Response): Promise<void> {
  if (!req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const parsed = createNewsSchema.parse({ body: req.body });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  const article = await createNews(req.admin.id, parsed.body, imageUrl);
  successResponse(res, 'Article created successfully', article, 201);
}

export async function updateNewsHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updateNewsSchema.parse({ body: req.body });
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  const article = await updateNews(id, parsed.body, imageUrl);
  successResponse(res, 'Article updated successfully', article);
}

export async function deleteNewsHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await deleteNews(id);
  successResponse(res, result.message);
}
