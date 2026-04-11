import { Router } from 'express';
import {
  listExecutivesHandler,
  adminListExecutivesHandler,
  adminGetExecutiveHandler,
  adminCreateExecutiveHandler,
  adminUpdateExecutiveHandler,
  adminDeleteExecutiveHandler,
} from './executives.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

// Public route
router.get('/', listExecutivesHandler);

export default router;

// Admin router (mounted separately at /api/admin/executives)
export const adminExecutivesRouter = Router();

adminExecutivesRouter.get('/', adminMiddleware, adminListExecutivesHandler);
adminExecutivesRouter.get('/:id', adminMiddleware, adminGetExecutiveHandler);
adminExecutivesRouter.post('/', adminMiddleware, uploadSingle('photo'), adminCreateExecutiveHandler);
adminExecutivesRouter.put('/:id', adminMiddleware, uploadSingle('photo'), adminUpdateExecutiveHandler);
adminExecutivesRouter.delete('/:id', adminMiddleware, adminDeleteExecutiveHandler);
