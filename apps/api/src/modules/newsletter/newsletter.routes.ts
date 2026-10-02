import { Router } from 'express';
import {
  subscribeHandler,
  adminListSubscribersHandler,
  adminUnsubscribeHandler,
  adminDeleteSubscriberHandler,
  unsubscribePageHandler,
  unsubscribeOneClickHandler,
} from './newsletter.controller';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
import { newsletterLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public
router.post('/', newsletterLimiter, subscribeHandler);
// Signed links from marketing emails (see utils/email.utils.ts → sendMarketingEmail)
router.get('/unsubscribe', newsletterLimiter, unsubscribePageHandler);
router.post('/unsubscribe', newsletterLimiter, unsubscribeOneClickHandler);

export default router;

// Admin router (mounted separately at /api/admin/newsletter)
export const adminNewsletterRouter = Router();

adminNewsletterRouter.use(adminMiddleware);
adminNewsletterRouter.get('/', requirePermission('newsletter:view'), adminListSubscribersHandler);
adminNewsletterRouter.put('/:id/unsubscribe', requirePermission('newsletter:edit'), adminUnsubscribeHandler);
adminNewsletterRouter.delete('/:id', requirePermission('newsletter:delete'), adminDeleteSubscriberHandler);
