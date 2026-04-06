import { Router } from 'express';
import {
  listNewsHandler,
  getNewsBySlugHandler,
  createNewsHandler,
  updateNewsHandler,
  deleteNewsHandler,
} from './news.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', listNewsHandler);
router.get('/:slug', getNewsBySlugHandler);

// Admin routes
router.post('/admin', adminMiddleware, uploadSingle('image'), createNewsHandler);
router.put('/admin/:id', adminMiddleware, uploadSingle('image'), updateNewsHandler);
router.delete('/admin/:id', adminMiddleware, deleteNewsHandler);

export default router;
