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
  updatePreferencesHandler,
  exportMyDataHandler,
  deleteMyAccountHandler,
} from './members.controller';
import { authMiddleware, memberOrAdminMiddleware } from '../../middleware/auth.middleware';
import { blockMemberHandler, unblockMemberHandler, listBlocksHandler } from '../blocks/blocks.controller';
import { adminMiddleware, requireAdminRole } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { uploadLimiter, dataExportLimiter, accountDeletionLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Directory: any signed-in member OR admin (alumni, mobile and admin all read it)
router.get('/directory', memberOrAdminMiddleware, getMemberDirectoryHandler);

// Auth required
router.get('/', authMiddleware, listMembersHandler);
router.get('/my/dues', authMiddleware, getMyDuesHandler);
router.get('/my/donations', authMiddleware, getMyDonationsHandler);
router.put('/profile', authMiddleware, updateProfileHandler);
router.post('/profile/photo', authMiddleware, uploadLimiter, uploadSingle('photo'), uploadProfilePhotoHandler);
// Blocking (UGC safety) — before '/:id'
router.get('/blocks', authMiddleware, listBlocksHandler);
router.post('/blocks', authMiddleware, blockMemberHandler);
router.delete('/blocks/:memberId', authMiddleware, unblockMemberHandler);

// Privacy self-service (Ghana Data Protection Act 2012 / app-store account deletion)
router.put('/me/preferences', authMiddleware, updatePreferencesHandler);
router.get('/me/export', authMiddleware, dataExportLimiter, exportMyDataHandler);
router.delete('/me', authMiddleware, accountDeletionLimiter, deleteMyAccountHandler);
router.get('/:id', authMiddleware, getMemberByIdHandler);

export default router;

// Admin router (mounted separately at /api/admin/members)
export const adminMembersRouter = Router();

adminMembersRouter.get('/', adminMiddleware, adminListMembersHandler);
adminMembersRouter.get('/:id', adminMiddleware, adminGetMemberByIdHandler);
adminMembersRouter.put('/:id/approve', adminMiddleware, approveMemberHandler);
// Destructive member operations: ADMIN / SUPER_ADMIN only (not moderators)
adminMembersRouter.put('/:id/suspend', adminMiddleware, requireAdminRole, suspendMemberHandler);
adminMembersRouter.put('/:id/status', adminMiddleware, requireAdminRole, changeMemberStatusHandler);
adminMembersRouter.delete('/:id', adminMiddleware, requireAdminRole, deleteMemberHandler);
