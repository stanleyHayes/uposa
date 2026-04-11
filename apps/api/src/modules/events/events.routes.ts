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
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', listEventsHandler);
router.get('/upcoming', getUpcomingEventsHandler);
router.get('/past', getPastEventsHandler);
router.get('/:slug', getEventBySlugHandler);
router.post('/:id/rsvp', rsvpToEventHandler); // public RSVP (memberId optional)

// Admin routes
router.post('/admin', adminMiddleware, uploadSingle('image'), createEventHandler);
router.put('/admin/:id', adminMiddleware, uploadSingle('image'), updateEventHandler);
router.delete('/admin/:id', adminMiddleware, deleteEventHandler);
router.get('/admin/:id/rsvps', adminMiddleware, getEventRsvpsHandler);

export default router;
