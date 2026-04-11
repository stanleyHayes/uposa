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
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

// Admin routes (must be before /:id to avoid param collision)
router.get('/admin/all', adminMiddleware, adminListAllElectionsHandler);
router.post('/admin', adminMiddleware, createElectionHandler);
router.put('/admin/:id', adminMiddleware, adminUpdateElectionHandler);
router.put('/admin/:id/status', adminMiddleware, changeElectionStatusHandler);
router.get('/admin/:id/results', adminMiddleware, getElectionResultsHandler);
router.delete('/admin/:id', adminMiddleware, adminDeleteElectionHandler);

// Member routes
router.get('/', authMiddleware, listElectionsHandler);
router.post('/:id/vote', authMiddleware, castVoteHandler);
router.get('/:id', authMiddleware, getElectionByIdHandler);

export default router;
