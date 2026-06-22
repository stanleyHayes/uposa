import { Router } from 'express';
import {
  subscribeHandler,
  adminListSubscribersHandler,
  adminUnsubscribeHandler,
  adminDeleteSubscriberHandler,
} from './newsletter.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { publicWriteLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public
router.post('/', publicWriteLimiter, subscribeHandler);

export default router;

// Admin router (mounted separately at /api/admin/newsletter)
export const adminNewsletterRouter = Router();

adminNewsletterRouter.use(adminMiddleware);
adminNewsletterRouter.get('/', adminListSubscribersHandler);
adminNewsletterRouter.put('/:id/unsubscribe', adminUnsubscribeHandler);
adminNewsletterRouter.delete('/:id', adminDeleteSubscriberHandler);
