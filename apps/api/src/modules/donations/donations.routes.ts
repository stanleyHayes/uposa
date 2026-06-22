import { Router } from 'express';
import {
  submitDonationHandler,
  getMyDonationsHandler,
  adminListDonationsHandler,
  confirmDonationHandler,
  getDonationSummaryHandler,
  getDonationByIdHandler,
} from './donations.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { publicWriteLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public / optional auth
router.post('/', publicWriteLimiter, optionalAuthMiddleware, submitDonationHandler);

// Auth required
router.get('/my', authMiddleware, getMyDonationsHandler);

// Admin routes
router.get('/admin/summary', adminMiddleware, getDonationSummaryHandler);
router.get('/admin', adminMiddleware, adminListDonationsHandler);
router.get('/admin/:id', adminMiddleware, getDonationByIdHandler);
router.put('/admin/:id/confirm', adminMiddleware, confirmDonationHandler);

export default router;
