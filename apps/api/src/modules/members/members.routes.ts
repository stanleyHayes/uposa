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
import { Request, Response, NextFunction } from 'express';
import { forbiddenMessage } from '../../config/permissions';
import { errorResponse } from '../../utils/response.utils';

/** For member-or-admin routes: members pass; an admin also needs `permission`. */
function adminNeedsPermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.admin && !req.admin.permissions?.includes(permission)) {
      errorResponse(res, forbiddenMessage(permission), 403);
      return;
    }
    next();
  };
}
import { blockMemberHandler, unblockMemberHandler, listBlocksHandler } from '../blocks/blocks.controller';
import { adminMiddleware, requirePermission, requireAnyPermission } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { uploadLimiter, dataExportLimiter, accountDeletionLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Directory: any signed-in member OR admin (alumni, mobile and admin all read it)
router.get('/directory', memberOrAdminMiddleware, adminNeedsPermission('members:view'), getMemberDirectoryHandler);

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

// List/detail serve both Members (everyone) and Registrations (pending only) — narrowed in the handlers.
adminMembersRouter.get('/', adminMiddleware, requireAnyPermission('members:view', 'registrations:view'), adminListMembersHandler);
adminMembersRouter.get('/:id', adminMiddleware, requireAnyPermission('members:view', 'registrations:view'), adminGetMemberByIdHandler);
adminMembersRouter.put('/:id/approve', adminMiddleware, requirePermission('registrations:edit'), approveMemberHandler);
// Member changes: members:edit / members:delete (not in the MODERATOR defaults)
adminMembersRouter.put('/:id/suspend', adminMiddleware, requirePermission('members:edit'), suspendMemberHandler);
// Rejecting a pending registration (PENDING → INACTIVE) is registrations:edit; any other status change is members:edit.
adminMembersRouter.put('/:id/status', adminMiddleware, requireAnyPermission('members:edit', 'registrations:edit'), changeMemberStatusHandler);
adminMembersRouter.delete('/:id', adminMiddleware, requirePermission('members:delete'), deleteMemberHandler);
