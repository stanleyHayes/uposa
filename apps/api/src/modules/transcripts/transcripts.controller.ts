import { Request, Response } from 'express';
import { createTranscriptRequestSchema } from './transcripts.validation';
import { submitTranscriptRequest } from './transcripts.service';
import { successResponse } from '../../utils/response.utils';

export async function submitTranscriptRequestHandler(req: Request, res: Response): Promise<void> {
  const parsed = createTranscriptRequestSchema.parse({ body: req.body });
  const request = await submitTranscriptRequest(parsed.body);
  successResponse(res, 'Transcript request submitted successfully', request, 201);
}
