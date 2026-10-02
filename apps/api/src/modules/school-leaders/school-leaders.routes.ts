import { Router } from 'express';
import {
  listSchoolLeadersHandler,
  adminListSchoolLeadersHandler,
  adminGetSchoolLeaderHandler,
  adminCreateSchoolLeaderHandler,
  adminUpdateSchoolLeaderHandler,
  adminDeleteSchoolLeaderHandler,
} from './school-leaders.controller';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { uploadLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public route
router.get('/', listSchoolLeadersHandler);

export default router;

// Admin router (mounted separately at /api/admin/school-leaders)
export const adminSchoolLeadersRouter = Router();

adminSchoolLeadersRouter.use(adminMiddleware);
adminSchoolLeadersRouter.get('/', requirePermission('school_leaders:view'), adminListSchoolLeadersHandler);
adminSchoolLeadersRouter.get('/:id', requirePermission('school_leaders:view'), adminGetSchoolLeaderHandler);
adminSchoolLeadersRouter.post('/', requirePermission('school_leaders:create'), uploadLimiter, uploadSingle('photo'), adminCreateSchoolLeaderHandler);
adminSchoolLeadersRouter.put('/:id', requirePermission('school_leaders:edit'), uploadLimiter, uploadSingle('photo'), adminUpdateSchoolLeaderHandler);
adminSchoolLeadersRouter.delete('/:id', requirePermission('school_leaders:delete'), adminDeleteSchoolLeaderHandler);
