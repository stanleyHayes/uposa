import { Router } from 'express';
import {
  listNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
} from './notifications.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

router.get('/', adminMiddleware, listNotificationsHandler);
router.get('/unread-count', adminMiddleware, getUnreadCountHandler);
router.put('/:id/read', adminMiddleware, markAsReadHandler);
router.put('/read-all', adminMiddleware, markAllAsReadHandler);

export default router;
