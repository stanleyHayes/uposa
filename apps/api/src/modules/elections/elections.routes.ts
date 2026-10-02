import { Router } from 'express';
import {
  listElectionsHandler,
  getElectionByIdHandler,
  castVoteHandler,
  createElectionHandler,
  changeElectionStatusHandler,
  getElectionResultsHandler,
  adminListAllElectionsHandler,
  adminDeleteElectionHandler,
  adminUpdateElectionHandler,
} from './elections.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';

const router = Router();

// Admin routes (must be before /:id to avoid param collision)
router.get('/admin/all', adminMiddleware, requirePermission('elections:view'), adminListAllElectionsHandler);
router.post('/admin', adminMiddleware, requirePermission('elections:create'), createElectionHandler);
router.put('/admin/:id', adminMiddleware, requirePermission('elections:edit'), adminUpdateElectionHandler);
router.put('/admin/:id/status', adminMiddleware, requirePermission('elections:edit'), changeElectionStatusHandler);
router.get('/admin/:id/results', adminMiddleware, requirePermission('elections:view'), getElectionResultsHandler);
router.delete('/admin/:id', adminMiddleware, requirePermission('elections:delete'), adminDeleteElectionHandler);

// Member routes
router.get('/', authMiddleware, listElectionsHandler);
router.post('/:id/vote', authMiddleware, castVoteHandler);
router.get('/:id', authMiddleware, getElectionByIdHandler);

export default router;
