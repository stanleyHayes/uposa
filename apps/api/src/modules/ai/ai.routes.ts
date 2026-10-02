import { Router } from 'express';
import { aiWritingHandler } from './ai.controller';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';

const router = Router();

router.post('/writing', adminMiddleware, requirePermission('ai:create'), aiWritingHandler);

export default router;
