import { Router } from 'express';
import {
  listNewsHandler,
  adminListNewsHandler,
  getNewsBySlugHandler,
  adminGetNewsByIdHandler,
  createNewsHandler,
  updateNewsHandler,
  deleteNewsHandler,
} from './news.controller';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { uploadLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Admin routes (must be before /:slug to avoid conflict)
router.get('/admin', adminMiddleware, requirePermission('news:view'), adminListNewsHandler);
router.get('/admin/:id', adminMiddleware, requirePermission('news:view'), adminGetNewsByIdHandler);
router.post('/admin', adminMiddleware, requirePermission('news:create'), uploadLimiter, uploadSingle('image'), createNewsHandler);
router.put('/admin/:id', adminMiddleware, requirePermission('news:edit'), uploadLimiter, uploadSingle('image'), updateNewsHandler);
router.delete('/admin/:id', adminMiddleware, requirePermission('news:delete'), deleteNewsHandler);

// Public routes
router.get('/', listNewsHandler);
router.get('/:slug', getNewsBySlugHandler);

export default router;
