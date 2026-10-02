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
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

// Public: published, audience ALL, not expired
router.get('/', listPublicAnnouncementsHandler);

// Members: audience ALL or MEMBERS
router.get('/members', authMiddleware, listMemberAnnouncementsHandler);

// Admin
router.get('/admin', adminMiddleware, adminListAnnouncementsHandler);
router.get('/admin/:id', adminMiddleware, adminGetAnnouncementHandler);
router.post('/admin', adminMiddleware, adminCreateAnnouncementHandler);
router.put('/admin/:id', adminMiddleware, adminUpdateAnnouncementHandler);
router.delete('/admin/:id', adminMiddleware, adminDeleteAnnouncementHandler);

export default router;
