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
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

// Admin routes (must be before /:slug to avoid conflict)
router.get('/admin', adminMiddleware, adminListNewsHandler);
router.get('/admin/:id', adminMiddleware, adminGetNewsByIdHandler);
router.post('/admin', adminMiddleware, uploadSingle('image'), createNewsHandler);
router.put('/admin/:id', adminMiddleware, uploadSingle('image'), updateNewsHandler);
router.delete('/admin/:id', adminMiddleware, deleteNewsHandler);

// Public routes
router.get('/', listNewsHandler);
router.get('/:slug', getNewsBySlugHandler);

export default router;
