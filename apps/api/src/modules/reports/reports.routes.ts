import { Router } from 'express';
import {
  createReportHandler,
  adminListReportsHandler,
  adminGetReportHandler,
  adminResolveReportHandler,
} from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { reportLimiter } from '../../middleware/ratelimit.middleware';

// Members: POST /api/reports
const router = Router();
router.post('/', authMiddleware, reportLimiter, createReportHandler);
export default router;

// Admins: /api/admin/reports (SUSPEND_AUTHOR additionally needs ADMIN/SUPER_ADMIN — checked in the service)
export const adminReportsRouter = Router();
adminReportsRouter.use(adminMiddleware);
adminReportsRouter.get('/', adminListReportsHandler);
adminReportsRouter.get('/:id', adminGetReportHandler);
adminReportsRouter.put('/:id', adminResolveReportHandler);
