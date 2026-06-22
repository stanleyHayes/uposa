import { Router } from 'express';
import {
  listGalleryHandler,
  listPublicCategoriesHandler,
  adminListGalleryHandler,
  adminBulkUploadHandler,
  adminUpdateItemHandler,
  adminDeleteGalleryHandler,
  adminBulkDeleteHandler,
  adminListCategoriesHandler,
  adminGetCategoryHandler,
  adminCreateCategoryHandler,
  adminUpdateCategoryHandler,
  adminDeleteCategoryHandler,
} from './gallery.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadMultiple, uploadSingle } from '../../middleware/upload.middleware';
import { uploadLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public
router.get('/', listGalleryHandler);
router.get('/categories', listPublicCategoriesHandler);

export default router;

// Admin router (mounted separately at /api/admin/gallery)
export const adminGalleryRouter = Router();

adminGalleryRouter.use(adminMiddleware);
adminGalleryRouter.get('/', adminListGalleryHandler);
adminGalleryRouter.post('/upload', uploadLimiter, uploadMultiple('images', 20), adminBulkUploadHandler);
adminGalleryRouter.put('/items/:id', adminUpdateItemHandler);
adminGalleryRouter.delete('/:id', adminDeleteGalleryHandler);
adminGalleryRouter.post('/bulk-delete', adminBulkDeleteHandler);

// Category CRUD
adminGalleryRouter.get('/categories', adminListCategoriesHandler);
adminGalleryRouter.get('/categories/:id', adminGetCategoryHandler);
adminGalleryRouter.post('/categories', uploadLimiter, uploadSingle('coverImage'), adminCreateCategoryHandler);
adminGalleryRouter.put('/categories/:id', uploadLimiter, uploadSingle('coverImage'), adminUpdateCategoryHandler);
adminGalleryRouter.delete('/categories/:id', adminDeleteCategoryHandler);
