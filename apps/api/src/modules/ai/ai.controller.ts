import { Response } from 'express';
import { aiWritingSchema } from './ai.validation';
import { runAiWritingAssistant } from './ai.service';
import { RouteRequest } from '../../types/request.types';
import { errorResponse, successResponse } from '../../utils/response.utils';

export async function aiWritingHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.admin) {
    errorResponse(res, 'Admin authentication required', 401);
    return;
  }

  const parsed = aiWritingSchema.parse({ body: req.body });
  const result = await runAiWritingAssistant(req.admin.id, parsed.body);
  successResponse(res, 'AI writing suggestion generated', result);
}
