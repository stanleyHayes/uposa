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
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', listProjectsHandler);
router.get('/ongoing', getOngoingProjectsHandler);
router.get('/completed', getCompletedProjectsHandler);
router.get('/:slug', getProjectBySlugHandler);

// Admin routes
router.post('/admin', adminMiddleware, uploadSingle('image'), createProjectHandler);
router.put('/admin/:id', adminMiddleware, uploadSingle('image'), updateProjectHandler);
router.delete('/admin/:id', adminMiddleware, deleteProjectHandler);

export default router;
