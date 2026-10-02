import { Router } from 'express';
import {
  getMyDuesHandler,
  memberPayDueHandler,
  getMemberDueSummaryHandler,
  adminListDuesHandler,
  createDueHandler,
  markDuePaidHandler,
  bulkCreateDuesHandler,
} from './dues.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware, requireAdminRole } from '../../middleware/admin.middleware';

const router = Router();

// Member routes
router.get('/my', authMiddleware, getMyDuesHandler);
router.get('/my/summary', authMiddleware, getMemberDueSummaryHandler);
router.post('/my/:id/pay', authMiddleware, memberPayDueHandler);

// Admin routes
router.get('/admin', adminMiddleware, adminListDuesHandler);
// Financial records: ADMIN / SUPER_ADMIN only (not moderators)
router.post('/admin', adminMiddleware, requireAdminRole, createDueHandler);
router.put('/admin/:id/mark-paid', adminMiddleware, requireAdminRole, markDuePaidHandler);
router.post('/admin/bulk', adminMiddleware, requireAdminRole, bulkCreateDuesHandler);

export default router;
