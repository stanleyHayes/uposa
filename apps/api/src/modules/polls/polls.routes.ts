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
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';

const router = Router();

// Admin routes (must be before /:id to avoid param collision)
router.get('/admin/all', adminMiddleware, requirePermission('polls:view'), adminListAllPollsHandler);
router.post('/admin', adminMiddleware, requirePermission('polls:create'), createPollHandler);
router.put('/admin/:id', adminMiddleware, requirePermission('polls:edit'), adminUpdatePollHandler);
router.put('/admin/:id/close', adminMiddleware, requirePermission('polls:edit'), closePollHandler);
router.get('/admin/:id/results', adminMiddleware, requirePermission('polls:view'), adminGetPollResultsHandler);
router.delete('/admin/:id', adminMiddleware, requirePermission('polls:delete'), adminDeletePollHandler);

// Member routes
router.get('/', authMiddleware, listPollsHandler);
router.post('/:id/vote', authMiddleware, castVoteHandler);
router.get('/:id', authMiddleware, getPollByIdHandler);

export default router;
