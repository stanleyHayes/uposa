import { Router } from 'express';
import {
  submitDonationHandler,
  getMyDonationsHandler,
  adminListDonationsHandler,
  confirmDonationHandler,
  getDonationSummaryHandler,
} from './donations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

// Public / optional auth
router.post('/', submitDonationHandler);

// Auth required
router.get('/my', authMiddleware, getMyDonationsHandler);

// Admin routes
router.get('/admin/summary', adminMiddleware, getDonationSummaryHandler);
router.get('/admin', adminMiddleware, adminListDonationsHandler);
router.put('/admin/:id/confirm', adminMiddleware, confirmDonationHandler);

export default router;
