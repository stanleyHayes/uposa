import { Router } from 'express';
import {
  listExecutivesHandler,
  adminListExecutivesHandler,
  adminGetExecutiveHandler,
  adminCreateExecutiveHandler,
  adminUpdateExecutiveHandler,
  adminDeleteExecutiveHandler,
} from './executives.controller';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { uploadLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public route
router.get('/', listExecutivesHandler);

export default router;

// Admin router (mounted separately at /api/admin/executives)
export const adminExecutivesRouter = Router();

adminExecutivesRouter.get('/', adminMiddleware, requirePermission('executives:view'), adminListExecutivesHandler);
adminExecutivesRouter.get('/:id', adminMiddleware, requirePermission('executives:view'), adminGetExecutiveHandler);
adminExecutivesRouter.post('/', adminMiddleware, requirePermission('executives:create'), uploadLimiter, uploadSingle('photo'), adminCreateExecutiveHandler);
adminExecutivesRouter.put('/:id', adminMiddleware, requirePermission('executives:edit'), uploadLimiter, uploadSingle('photo'), adminUpdateExecutiveHandler);
adminExecutivesRouter.delete('/:id', adminMiddleware, requirePermission('executives:delete'), adminDeleteExecutiveHandler);
