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
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
import { donationLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public / optional auth
router.post('/', donationLimiter, optionalAuthMiddleware, submitDonationHandler);

// Auth required
router.get('/my', authMiddleware, getMyDonationsHandler);

// Admin routes
router.get('/admin/summary', adminMiddleware, requirePermission('donations:view'), getDonationSummaryHandler);
router.get('/admin', adminMiddleware, requirePermission('donations:view'), adminListDonationsHandler);
router.get('/admin/:id', adminMiddleware, requirePermission('donations:view'), getDonationByIdHandler);
// Financial records: donations:* (not in the MODERATOR defaults)
router.post('/admin', adminMiddleware, requirePermission('donations:create'), adminCreateDonationHandler);
router.put('/admin/:id/confirm', adminMiddleware, requirePermission('donations:edit'), confirmDonationHandler);
router.put('/admin/:id', adminMiddleware, requirePermission('donations:edit'), adminUpdateDonationHandler);
router.delete('/admin/:id', adminMiddleware, requirePermission('donations:delete'), adminDeleteDonationHandler);

export default router;
