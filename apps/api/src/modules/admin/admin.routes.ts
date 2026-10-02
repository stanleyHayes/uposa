import { Router } from 'express';
import {
  getDashboardStatsHandler,
  listAdminsHandler,
  createAdminHandler,
  updateAdminHandler,
  deactivateAdminHandler,
  updateProfileHandler,
  changePasswordHandler,
} from './admin.controller';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';

const router = Router();

// Dashboard
router.get('/dashboard/stats', adminMiddleware, getDashboardStatsHandler);

// Self-service (any authenticated admin)
router.put('/profile', adminMiddleware, updateProfileHandler);
router.put('/change-password', adminMiddleware, changePasswordHandler);

// Admin management (admin_users:*; create/edit/delete default to SUPER_ADMIN only)
router.get('/admins', adminMiddleware, requirePermission('admin_users:view'), listAdminsHandler);
router.post('/admins', adminMiddleware, requirePermission('admin_users:create'), createAdminHandler);
router.put('/admins/:id', adminMiddleware, requirePermission('admin_users:edit'), updateAdminHandler);
router.delete('/admins/:id', adminMiddleware, requirePermission('admin_users:delete'), deactivateAdminHandler);

export default router;
