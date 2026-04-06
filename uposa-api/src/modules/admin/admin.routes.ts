import { Router } from 'express';
import {
  getDashboardStatsHandler,
  listAdminsHandler,
  createAdminHandler,
  updateAdminHandler,
  deactivateAdminHandler,
} from './admin.controller';
import { adminMiddleware, requireRole } from '../../middleware/admin.middleware';

const router = Router();

// Dashboard
router.get('/dashboard/stats', adminMiddleware, getDashboardStatsHandler);

// Admin management - SUPER_ADMIN only for create/delete
router.get('/admins', adminMiddleware, listAdminsHandler);
router.post('/admins', adminMiddleware, requireRole('SUPER_ADMIN'), createAdminHandler);
router.put('/admins/:id', adminMiddleware, requireRole('SUPER_ADMIN'), updateAdminHandler);
router.delete('/admins/:id', adminMiddleware, requireRole('SUPER_ADMIN'), deactivateAdminHandler);

export default router;
