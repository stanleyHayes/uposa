import { Router } from 'express';
import {
  listJobsHandler,
  getJobByIdHandler,
  postJobHandler,
  getMyPostingsHandler,
  updateMyJobHandler,
  deleteMyJobHandler,
  applyToJobHandler,
  getMyApplicationsHandler,
  getJobApplicationsHandler,
  updateApplicationStatusHandler,
  adminListAllJobsHandler,
  adminListPendingJobsHandler,
  approveJobHandler,
  deleteJobHandler,
  adminGetJobApplicationsHandler,
  adminUpdateApplicationStatusHandler,
  adminCreateJobHandler,
  adminUpdateJobHandler,
} from './jobs.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';

const router = Router();

// Public routes
// Public; a signed-in member's blocks also apply.
router.get('/', optionalAuthMiddleware, listJobsHandler);
router.get('/my/postings', authMiddleware, getMyPostingsHandler);
router.get('/my/applications', authMiddleware, getMyApplicationsHandler);

// Auth required - member actions
router.post('/', authMiddleware, postJobHandler);
router.post('/:id/apply', authMiddleware, applyToJobHandler);
router.get('/:id/applications', authMiddleware, getJobApplicationsHandler);
router.put('/my/:id', authMiddleware, updateMyJobHandler);
router.delete('/my/:id', authMiddleware, deleteMyJobHandler);
router.put('/applications/:id/status', authMiddleware, updateApplicationStatusHandler);

// Admin routes
router.get('/admin/all', adminMiddleware, requirePermission('jobs:view'), adminListAllJobsHandler);
router.get('/admin/pending', adminMiddleware, requirePermission('jobs:view'), adminListPendingJobsHandler);
router.post('/admin', adminMiddleware, requirePermission('jobs:create'), adminCreateJobHandler);
router.put('/admin/:id', adminMiddleware, requirePermission('jobs:edit'), adminUpdateJobHandler);
router.put('/admin/:id/approve', adminMiddleware, requirePermission('jobs:edit'), approveJobHandler);
router.delete('/admin/:id', adminMiddleware, requirePermission('jobs:delete'), deleteJobHandler);
router.get('/admin/:id/applications', adminMiddleware, requirePermission('jobs:view'), adminGetJobApplicationsHandler);
router.put('/admin/applications/:id/status', adminMiddleware, requirePermission('jobs:edit'), adminUpdateApplicationStatusHandler);

// Public - must be last (catch-all param route)
router.get('/:id', optionalAuthMiddleware, getJobByIdHandler);

export default router;
