import { Request, Response } from 'express';
import { createDueSchema, markPaidSchema, bulkCreateDuesSchema, memberPayDueSchema } from './dues.validation';
import {
  getMyDues,
  memberPayDue,
  getMemberDueSummary,
  adminListDues,
  createDue,
  markDuePaid,
  bulkCreateDues,
} from './dues.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export async function getMyDuesHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const result = await getMyDues(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Dues retrieved', result.data, 200, result.meta);
}

export async function memberPayDueHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const parsed = memberPayDueSchema.parse({ body: req.body });
  const due = await memberPayDue(id, req.user.id, parsed.body);
  successResponse(res, 'Payment submitted successfully', due);
}

export async function getMemberDueSummaryHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const summary = await getMemberDueSummary(req.user.id);
  successResponse(res, 'Due summary retrieved', summary);
}

export async function adminListDuesHandler(req: Request, res: Response): Promise<void> {
  const result = await adminListDues(req.query as Record<string, string | undefined>);
  successResponse(res, 'Dues retrieved', result.data, 200, result.meta);
}

export async function createDueHandler(req: Request, res: Response): Promise<void> {
  const parsed = createDueSchema.parse({ body: req.body });
  const due = await createDue(parsed.body);
  successResponse(res, 'Due created successfully', due, 201);
}

export async function markDuePaidHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = markPaidSchema.parse({ body: req.body });
  const due = await markDuePaid(id, parsed.body);
  successResponse(res, 'Due marked as paid', due);
}

export async function bulkCreateDuesHandler(req: Request, res: Response): Promise<void> {
  const parsed = bulkCreateDuesSchema.parse({ body: req.body });
  const result = await bulkCreateDues(parsed.body);
  successResponse(res, result.message, { created: result.created }, 201);
}
