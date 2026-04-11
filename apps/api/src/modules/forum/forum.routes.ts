import { Router } from 'express';
import {
  listPostsHandler,
  getPostBySlugHandler,
  createPostHandler,
  updatePostHandler,
  deletePostHandler,
  addCommentHandler,
  deleteCommentHandler,
  adminListPostsHandler,
  adminTogglePinPostHandler,
  adminToggleLockPostHandler,
  adminDeletePostHandler,
  adminDeleteCommentHandler,
  adminUpdatePostHandler,
} from './forum.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

// Member routes
router.get('/posts', authMiddleware, listPostsHandler);
router.post('/posts', authMiddleware, createPostHandler);
router.put('/posts/:id', authMiddleware, updatePostHandler);
router.delete('/posts/:id', authMiddleware, deletePostHandler);
router.post('/posts/:id/comments', authMiddleware, addCommentHandler);
router.delete('/comments/:id', authMiddleware, deleteCommentHandler);
router.get('/posts/:slug', authMiddleware, getPostBySlugHandler);

// Admin routes
router.get('/admin/posts', adminMiddleware, adminListPostsHandler);
router.put('/admin/posts/:id', adminMiddleware, adminUpdatePostHandler);
router.put('/admin/posts/:id/pin', adminMiddleware, adminTogglePinPostHandler);
router.put('/admin/posts/:id/lock', adminMiddleware, adminToggleLockPostHandler);
router.delete('/admin/posts/:id', adminMiddleware, adminDeletePostHandler);
router.delete('/admin/comments/:id', adminMiddleware, adminDeleteCommentHandler);

export default router;
