import { Router } from 'express';
import {
  listMembersHandler,
  getMemberDirectoryHandler,
  getMemberByIdHandler,
  updateProfileHandler,
  uploadProfilePhotoHandler,
  getMyDuesHandler,
  getMyDonationsHandler,
  adminListMembersHandler,
  adminGetMemberByIdHandler,
  approveMemberHandler,
  suspendMemberHandler,
  changeMemberStatusHandler,
  deleteMemberHandler,
} from './members.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/directory', getMemberDirectoryHandler);

// Auth required
router.get('/', authMiddleware, listMembersHandler);
router.get('/my/dues', authMiddleware, getMyDuesHandler);
router.get('/my/donations', authMiddleware, getMyDonationsHandler);
router.put('/profile', authMiddleware, updateProfileHandler);
router.post('/profile/photo', authMiddleware, uploadSingle('photo'), uploadProfilePhotoHandler);
router.get('/:id', authMiddleware, getMemberByIdHandler);

export default router;

// Admin router (mounted separately at /api/admin/members)
export const adminMembersRouter = Router();

adminMembersRouter.get('/', adminMiddleware, adminListMembersHandler);
adminMembersRouter.get('/:id', adminMiddleware, adminGetMemberByIdHandler);
adminMembersRouter.put('/:id/approve', adminMiddleware, approveMemberHandler);
adminMembersRouter.put('/:id/suspend', adminMiddleware, suspendMemberHandler);
adminMembersRouter.put('/:id/status', adminMiddleware, changeMemberStatusHandler);
adminMembersRouter.delete('/:id', adminMiddleware, deleteMemberHandler);
