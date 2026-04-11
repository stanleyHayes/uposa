import { Router } from 'express';
import { submitTranscriptRequestHandler } from './transcripts.controller';

const router = Router();

// Public
router.post('/', submitTranscriptRequestHandler);

export default router;
