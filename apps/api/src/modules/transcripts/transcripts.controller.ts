import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { createTranscriptRequestSchema } from './transcripts.validation';
import { submitTranscriptRequest } from './transcripts.service';
import { successResponse } from '../../utils/response.utils';

export async function submitTranscriptRequestHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = createTranscriptRequestSchema.parse({ body: req.body });
  const request = await submitTranscriptRequest(parsed.body);
  successResponse(res, 'Transcript request submitted successfully', request, 201);
}
