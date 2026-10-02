import { Router } from 'express';
import {
  submitContactMessageHandler,
  adminListMessagesHandler,
  markMessageAsReadHandler,
  deleteMessageHandler,
  archiveMessageHandler,
  markMessageRepliedHandler,
} from './contact.controller';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
import { contactLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public
router.post('/', contactLimiter, submitContactMessageHandler);

// Admin routes
router.get('/admin', adminMiddleware, requirePermission('contact:view'), adminListMessagesHandler);
router.put('/admin/:id/read', adminMiddleware, requirePermission('contact:edit'), markMessageAsReadHandler);
router.put('/admin/:id/archive', adminMiddleware, requirePermission('contact:edit'), archiveMessageHandler);
router.put('/admin/:id/replied', adminMiddleware, requirePermission('contact:edit'), markMessageRepliedHandler);
router.delete('/admin/:id', adminMiddleware, requirePermission('contact:delete'), deleteMessageHandler);

export default router;
