import { Router } from 'express';
import {
  submitDonationHandler,
  getMyDonationsHandler,
  adminListDonationsHandler,
  confirmDonationHandler,
  getDonationSummaryHandler,
  getDonationByIdHandler,
  adminCreateDonationHandler,
  adminUpdateDonationHandler,
  adminDeleteDonationHandler,
} from './donations.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware, requireAdminRole } from '../../middleware/admin.middleware';
import { donationLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public / optional auth
router.post('/', donationLimiter, optionalAuthMiddleware, submitDonationHandler);

// Auth required
router.get('/my', authMiddleware, getMyDonationsHandler);

// Admin routes
router.get('/admin/summary', adminMiddleware, getDonationSummaryHandler);
router.get('/admin', adminMiddleware, adminListDonationsHandler);
router.get('/admin/:id', adminMiddleware, getDonationByIdHandler);
// Financial records: ADMIN / SUPER_ADMIN only (not moderators)
router.post('/admin', adminMiddleware, requireAdminRole, adminCreateDonationHandler);
router.put('/admin/:id/confirm', adminMiddleware, requireAdminRole, confirmDonationHandler);
router.put('/admin/:id', adminMiddleware, requireAdminRole, adminUpdateDonationHandler);
router.delete('/admin/:id', adminMiddleware, requireAdminRole, adminDeleteDonationHandler);

export default router;
