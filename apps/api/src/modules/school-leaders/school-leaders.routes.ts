import { Router } from 'express';
import {
  listSchoolLeadersHandler,
  adminListSchoolLeadersHandler,
  adminGetSchoolLeaderHandler,
  adminCreateSchoolLeaderHandler,
  adminUpdateSchoolLeaderHandler,
  adminDeleteSchoolLeaderHandler,
} from './school-leaders.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { uploadLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public route
router.get('/', listSchoolLeadersHandler);

export default router;

// Admin router (mounted separately at /api/admin/school-leaders)
export const adminSchoolLeadersRouter = Router();

adminSchoolLeadersRouter.use(adminMiddleware);
adminSchoolLeadersRouter.get('/', adminListSchoolLeadersHandler);
adminSchoolLeadersRouter.get('/:id', adminGetSchoolLeaderHandler);
adminSchoolLeadersRouter.post('/', uploadLimiter, uploadSingle('photo'), adminCreateSchoolLeaderHandler);
adminSchoolLeadersRouter.put('/:id', uploadLimiter, uploadSingle('photo'), adminUpdateSchoolLeaderHandler);
adminSchoolLeadersRouter.delete('/:id', adminDeleteSchoolLeaderHandler);
