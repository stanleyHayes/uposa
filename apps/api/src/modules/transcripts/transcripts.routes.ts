import { Router } from 'express';
import { submitTranscriptRequestHandler } from './transcripts.controller';
import { transcriptLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public
router.post('/', transcriptLimiter, submitTranscriptRequestHandler);

export default router;
