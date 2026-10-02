import { Router } from 'express';
import {
  createReportHandler,
  adminListReportsHandler,
  adminGetReportHandler,
  adminResolveReportHandler,
} from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
import { reportLimiter } from '../../middleware/ratelimit.middleware';

// Members: POST /api/reports
const router = Router();
router.post('/', authMiddleware, reportLimiter, createReportHandler);
export default router;

// Admins: /api/admin/reports (SUSPEND_AUTHOR additionally needs members:edit — checked in the service)
export const adminReportsRouter = Router();
adminReportsRouter.use(adminMiddleware);
adminReportsRouter.get('/', requirePermission('reports:view'), adminListReportsHandler);
adminReportsRouter.get('/:id', requirePermission('reports:view'), adminGetReportHandler);
adminReportsRouter.put('/:id', requirePermission('reports:edit'), adminResolveReportHandler);
