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
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';

const router = Router();

// Member routes
router.get('/my', authMiddleware, getMyDuesHandler);
router.get('/my/summary', authMiddleware, getMemberDueSummaryHandler);
router.post('/my/:id/pay', authMiddleware, memberPayDueHandler);

// Admin routes
router.get('/admin', adminMiddleware, requirePermission('dues:view'), adminListDuesHandler);
// Financial records: dues:create / dues:edit (not in the MODERATOR defaults)
router.post('/admin', adminMiddleware, requirePermission('dues:create'), createDueHandler);
router.put('/admin/:id/mark-paid', adminMiddleware, requirePermission('dues:edit'), markDuePaidHandler);
router.post('/admin/bulk', adminMiddleware, requirePermission('dues:create'), bulkCreateDuesHandler);

export default router;
