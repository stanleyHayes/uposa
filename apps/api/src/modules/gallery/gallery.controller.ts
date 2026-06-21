import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import {
  listGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  deleteMultipleGalleryItems,
  listGalleryCategories,
  getCategoryById,
  createGalleryCategory,
  updateGalleryCategory,
  deleteGalleryCategory,
} from './gallery.service';
import { successResponse, errorResponse } from '../../utils/response.utils';
import { uploadToCloudinary } from '../../utils/cloudinary.utils';

// ═══════════════════════════════════════════════════════════
//  PUBLIC
// ═══════════════════════════════════════════════════════════

export async function listGalleryHandler(req: RouteRequest, res: Response): Promise<void> {
  const category = req.query.category as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const items = await listGalleryItems({ category, categoryId });
  successResponse(res, 'Gallery items retrieved', items);
}

export async function listPublicCategoriesHandler(req: RouteRequest, res: Response): Promise<void> {
  const categories = await listGalleryCategories();
  successResponse(res, 'Gallery categories retrieved', categories);
}

// ═══════════════════════════════════════════════════════════
//  ADMIN — CATEGORIES
// ═══════════════════════════════════════════════════════════

export async function adminListCategoriesHandler(req: RouteRequest, res: Response): Promise<void> {
  const categories = await listGalleryCategories();
  successResponse(res, 'Gallery categories retrieved', categories);
}

export async function adminGetCategoryHandler(req: RouteRequest, res: Response): Promise<void> {
  const cat = await getCategoryById(req.params.id);
  successResponse(res, 'Category retrieved', cat);
}

export async function adminCreateCategoryHandler(req: RouteRequest, res: Response): Promise<void> {
  const { name, description } = req.body;
  if (!name) {
    errorResponse(res, 'Name is required', 400);
    return;
  }
  const coverImageUrl = req.file ? await uploadToCloudinary(req.file, 'gallery/categories') : undefined;
  const cat = await createGalleryCategory({ name, description, coverImageUrl });
  successResponse(res, 'Category created', cat, 201);
}

export async function adminUpdateCategoryHandler(req: RouteRequest, res: Response): Promise<void> {
  const { name, description, order } = req.body;
  const coverImageUrl = req.file ? await uploadToCloudinary(req.file, 'gallery/categories') : undefined;
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (order !== undefined) data.order = Number(order);
  if (coverImageUrl) data.coverImageUrl = coverImageUrl;
  const cat = await updateGalleryCategory(req.params.id, data);
  successResponse(res, 'Category updated', cat);
}

export async function adminDeleteCategoryHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await deleteGalleryCategory(req.params.id);
  successResponse(res, result.message);
}

// ═══════════════════════════════════════════════════════════
//  ADMIN — GALLERY ITEMS
// ═══════════════════════════════════════════════════════════

export async function adminListGalleryHandler(req: RouteRequest, res: Response): Promise<void> {
  const category = req.query.category as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const items = await listGalleryItems({ category, categoryId });
  successResponse(res, 'Gallery items retrieved', items);
}

export async function adminBulkUploadHandler(req: RouteRequest, res: Response): Promise<void> {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    errorResponse(res, 'At least one image is required', 400);
    return;
  }

  const { category, categoryId, captions } = req.body;

  const captionArr: string[] = captions
    ? (typeof captions === 'string' ? tryParseArray(captions) : captions)
    : [];

  const adminId = req.admin!.id;
  const created = [];

  for (let i = 0; i < files.length; i++) {
    const imageUrl = await uploadToCloudinary(files[i], 'gallery');
    const item = await createGalleryItem({
      title: files[i].originalname.replace(/\.[^.]+$/, ''),
      caption: captionArr[i] || undefined,
      imageUrl,
      category: category || undefined,
      categoryId: categoryId || undefined,
      createdById: adminId,
    });
    created.push(item);
  }

  successResponse(res, `${created.length} image(s) uploaded`, created, 201);
}

export async function adminUpdateItemHandler(req: RouteRequest, res: Response): Promise<void> {
  const { title, caption, description } = req.body;
  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (caption !== undefined) data.caption = caption;
  if (description !== undefined) data.description = description;
  const item = await updateGalleryItem(req.params.id, data);
  successResponse(res, 'Gallery item updated', item);
}

export async function adminDeleteGalleryHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await deleteGalleryItem(req.params.id);
  successResponse(res, result.message);
}

export async function adminBulkDeleteHandler(req: RouteRequest, res: Response): Promise<void> {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    errorResponse(res, 'ids array is required', 400);
    return;
  }
  const result = await deleteMultipleGalleryItems(ids);
  successResponse(res, result.message);
}

function tryParseArray(val: string): string[] {
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [val];
  } catch {
    return [val];
  }
}
