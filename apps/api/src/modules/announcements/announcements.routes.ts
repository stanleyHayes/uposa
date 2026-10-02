import { Router } from 'express';
import {
  listPublicAnnouncementsHandler,
  listMemberAnnouncementsHandler,
  adminListAnnouncementsHandler,
  adminGetAnnouncementHandler,
  adminCreateAnnouncementHandler,
  adminUpdateAnnouncementHandler,
  adminDeleteAnnouncementHandler,
} from './announcements.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';

const router = Router();

// Public: published, audience ALL, not expired
router.get('/', listPublicAnnouncementsHandler);

// Members: audience ALL or MEMBERS
router.get('/members', authMiddleware, listMemberAnnouncementsHandler);

// Admin
router.get('/admin', adminMiddleware, requirePermission('announcements:view'), adminListAnnouncementsHandler);
router.get('/admin/:id', adminMiddleware, requirePermission('announcements:view'), adminGetAnnouncementHandler);
router.post('/admin', adminMiddleware, requirePermission('announcements:create'), adminCreateAnnouncementHandler);
router.put('/admin/:id', adminMiddleware, requirePermission('announcements:edit'), adminUpdateAnnouncementHandler);
router.delete('/admin/:id', adminMiddleware, requirePermission('announcements:delete'), adminDeleteAnnouncementHandler);

export default router;
