import { Router } from 'express';
import {
  listEventsHandler,
  getUpcomingEventsHandler,
  getPastEventsHandler,
  getEventBySlugHandler,
  rsvpToEventHandler,
  createEventHandler,
  updateEventHandler,
  deleteEventHandler,
  getEventRsvpsHandler,
} from './events.controller';
import { optionalAuthMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { uploadLimiter, rsvpLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public routes
router.get('/', listEventsHandler);
router.get('/upcoming', getUpcomingEventsHandler);
router.get('/past', getPastEventsHandler);
router.get('/:slug', getEventBySlugHandler);
router.post('/:id/rsvp', rsvpLimiter, optionalAuthMiddleware, rsvpToEventHandler); // public RSVP (memberId optional)

// Admin routes
router.post('/admin', adminMiddleware, requirePermission('events:create'), uploadLimiter, uploadSingle('image'), createEventHandler);
router.put('/admin/:id', adminMiddleware, requirePermission('events:edit'), uploadLimiter, uploadSingle('image'), updateEventHandler);
router.delete('/admin/:id', adminMiddleware, requirePermission('events:delete'), deleteEventHandler);
router.get('/admin/:id/rsvps', adminMiddleware, requirePermission('events:view'), getEventRsvpsHandler);

export default router;
