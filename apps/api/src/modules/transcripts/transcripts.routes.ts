import { Router } from 'express';
import { submitTranscriptRequestHandler } from './transcripts.controller';
import { publicWriteLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public
router.post('/', publicWriteLimiter, submitTranscriptRequestHandler);

export default router;
