import { Router } from 'express';
import {
  listPollsHandler,
  getPollByIdHandler,
  castVoteHandler,
  createPollHandler,
  closePollHandler,
  adminListAllPollsHandler,
  adminUpdatePollHandler,
  adminDeletePollHandler,
  adminGetPollResultsHandler,
} from './polls.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

// Admin routes (must be before /:id to avoid param collision)
router.get('/admin/all', adminMiddleware, adminListAllPollsHandler);
router.post('/admin', adminMiddleware, createPollHandler);
router.put('/admin/:id', adminMiddleware, adminUpdatePollHandler);
router.put('/admin/:id/close', adminMiddleware, closePollHandler);
router.get('/admin/:id/results', adminMiddleware, adminGetPollResultsHandler);
router.delete('/admin/:id', adminMiddleware, adminDeletePollHandler);

// Member routes
router.get('/', authMiddleware, listPollsHandler);
router.post('/:id/vote', authMiddleware, castVoteHandler);
router.get('/:id', authMiddleware, getPollByIdHandler);

export default router;
