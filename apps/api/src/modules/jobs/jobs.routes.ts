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
} from './jobs.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

// Public routes
router.get('/', listJobsHandler);
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
router.get('/admin/all', adminMiddleware, adminListAllJobsHandler);
router.get('/admin/pending', adminMiddleware, adminListPendingJobsHandler);
router.put('/admin/:id/approve', adminMiddleware, approveJobHandler);
router.delete('/admin/:id', adminMiddleware, deleteJobHandler);
router.get('/admin/:id/applications', adminMiddleware, adminGetJobApplicationsHandler);
router.put('/admin/applications/:id/status', adminMiddleware, adminUpdateApplicationStatusHandler);

// Public - must be last (catch-all param route)
router.get('/:id', getJobByIdHandler);

export default router;
