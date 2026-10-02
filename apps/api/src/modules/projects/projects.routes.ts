import { Router } from 'express';
import {
  listProjectsHandler,
  getOngoingProjectsHandler,
  getCompletedProjectsHandler,
  getProjectBySlugHandler,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from './projects.controller';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { uploadLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public routes
router.get('/', listProjectsHandler);
router.get('/ongoing', getOngoingProjectsHandler);
router.get('/completed', getCompletedProjectsHandler);
router.get('/:slug', getProjectBySlugHandler);

// Admin routes
router.post('/admin', adminMiddleware, requirePermission('projects:create'), uploadLimiter, uploadSingle('image'), createProjectHandler);
router.put('/admin/:id', adminMiddleware, requirePermission('projects:edit'), uploadLimiter, uploadSingle('image'), updateProjectHandler);
router.delete('/admin/:id', adminMiddleware, requirePermission('projects:delete'), deleteProjectHandler);

export default router;
