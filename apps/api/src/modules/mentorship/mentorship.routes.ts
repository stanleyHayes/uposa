import { Router } from 'express';
import {
  listMentorsHandler,
  toggleMentorAvailabilityHandler,
  getMyMentorProfileHandler,
  sendMentorshipRequestHandler,
  getMyMenteeRequestsHandler,
  getMyMentorRequestsHandler,
  respondToRequestHandler,
  adminListMentorshipRequestsHandler,
  adminListMentorsHandler,
  adminDeleteMentorshipRequestHandler,
} from './mentorship.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';

const router = Router();

// Member routes
router.get('/mentors', authMiddleware, listMentorsHandler);
router.get('/my/profile', authMiddleware, getMyMentorProfileHandler);
router.put('/my/availability', authMiddleware, toggleMentorAvailabilityHandler);
router.post('/request', authMiddleware, sendMentorshipRequestHandler);
router.get('/my/requests', authMiddleware, getMyMenteeRequestsHandler);
router.get('/my/mentees', authMiddleware, getMyMentorRequestsHandler);
router.put('/requests/:id/respond', authMiddleware, respondToRequestHandler);

// Admin routes
router.get('/admin/requests', adminMiddleware, requirePermission('mentorship:view'), adminListMentorshipRequestsHandler);
router.get('/admin/mentors', adminMiddleware, requirePermission('mentorship:view'), adminListMentorsHandler);
router.delete('/admin/requests/:id', adminMiddleware, requirePermission('mentorship:delete'), adminDeleteMentorshipRequestHandler);

export default router;
