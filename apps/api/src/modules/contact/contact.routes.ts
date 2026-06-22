import { Router } from 'express';
import {
  submitContactMessageHandler,
  adminListMessagesHandler,
  markMessageAsReadHandler,
  deleteMessageHandler,
} from './contact.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { publicWriteLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public
router.post('/', publicWriteLimiter, submitContactMessageHandler);

// Admin routes
router.get('/admin', adminMiddleware, adminListMessagesHandler);
router.put('/admin/:id/read', adminMiddleware, markMessageAsReadHandler);
router.delete('/admin/:id', adminMiddleware, deleteMessageHandler);

export default router;
