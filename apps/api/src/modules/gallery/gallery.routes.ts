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
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
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
adminGalleryRouter.get('/', requirePermission('gallery:view'), adminListGalleryHandler);
adminGalleryRouter.post('/upload', requirePermission('gallery:create'), uploadLimiter, uploadMultiple('images', 20), adminBulkUploadHandler);
adminGalleryRouter.put('/items/:id', requirePermission('gallery:edit'), adminUpdateItemHandler);
adminGalleryRouter.delete('/:id', requirePermission('gallery:delete'), adminDeleteGalleryHandler);
adminGalleryRouter.post('/bulk-delete', requirePermission('gallery:delete'), adminBulkDeleteHandler);

// Category CRUD
adminGalleryRouter.get('/categories', requirePermission('gallery:view'), adminListCategoriesHandler);
adminGalleryRouter.get('/categories/:id', requirePermission('gallery:view'), adminGetCategoryHandler);
adminGalleryRouter.post('/categories', requirePermission('gallery:create'), uploadLimiter, uploadSingle('coverImage'), adminCreateCategoryHandler);
adminGalleryRouter.put('/categories/:id', requirePermission('gallery:edit'), uploadLimiter, uploadSingle('coverImage'), adminUpdateCategoryHandler);
adminGalleryRouter.delete('/categories/:id', requirePermission('gallery:delete'), adminDeleteCategoryHandler);
