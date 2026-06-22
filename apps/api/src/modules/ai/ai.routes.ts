import { Router } from 'express';
import { aiWritingHandler } from './ai.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';

const router = Router();

router.post('/writing', adminMiddleware, aiWritingHandler);

export default router;
