import { Router } from 'express';
import {
  submitContactMessageHandler,
  adminListMessagesHandler,
  markMessageAsReadHandler,
  deleteMessageHandler,
  archiveMessageHandler,
  markMessageRepliedHandler,
} from './contact.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { contactLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public
router.post('/', contactLimiter, submitContactMessageHandler);

// Admin routes
router.get('/admin', adminMiddleware, adminListMessagesHandler);
router.put('/admin/:id/read', adminMiddleware, markMessageAsReadHandler);
router.put('/admin/:id/archive', adminMiddleware, archiveMessageHandler);
router.put('/admin/:id/replied', adminMiddleware, markMessageRepliedHandler);
router.delete('/admin/:id', adminMiddleware, deleteMessageHandler);

export default router;
