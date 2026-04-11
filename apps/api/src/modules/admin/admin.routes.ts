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
import { adminMiddleware, requireRole } from '../../middleware/admin.middleware';

const router = Router();

// Dashboard
router.get('/dashboard/stats', adminMiddleware, getDashboardStatsHandler);

// Self-service (any authenticated admin)
router.put('/profile', adminMiddleware, updateProfileHandler);
router.put('/change-password', adminMiddleware, changePasswordHandler);

// Admin management - SUPER_ADMIN only for create/delete
router.get('/admins', adminMiddleware, listAdminsHandler);
router.post('/admins', adminMiddleware, requireRole('SUPER_ADMIN'), createAdminHandler);
router.put('/admins/:id', adminMiddleware, requireRole('SUPER_ADMIN'), updateAdminHandler);
router.delete('/admins/:id', adminMiddleware, requireRole('SUPER_ADMIN'), deactivateAdminHandler);

export default router;
