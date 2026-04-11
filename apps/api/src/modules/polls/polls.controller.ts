import { Request, Response } from 'express';
import { createPollSchema, castVoteSchema, updatePollSchema } from './polls.validation';
import {
  listPolls,
  getPollById,
  castVote,
  createPoll,
  closePoll,
  adminListAllPolls,
  adminUpdatePoll,
  adminDeletePoll,
  adminGetPollResults,
} from './polls.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

// Member handlers
export async function listPollsHandler(req: Request, res: Response): Promise<void> {
  const result = await listPolls(req.query as Record<string, string | undefined>);
  successResponse(res, 'Polls retrieved', result.data, 200, result.meta);
}

export async function getPollByIdHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const poll = await getPollById(id, req.user.id);
  successResponse(res, 'Poll retrieved', poll);
}

export async function castVoteHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const parsed = castVoteSchema.parse({ body: req.body });
  const result = await castVote(id, req.user.id, parsed.body);
  successResponse(res, result.message);
}

// Admin handlers
export async function createPollHandler(req: Request, res: Response): Promise<void> {
  if (!req.admin) { errorResponse(res, 'Unauthorized', 401); return; }
  const parsed = createPollSchema.parse({ body: req.body });
  const poll = await createPoll(req.admin.id, parsed.body);
  successResponse(res, 'Poll created successfully', poll, 201);
}

export async function closePollHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const poll = await closePoll(id);
  successResponse(res, 'Poll closed', poll);
}

export async function adminListAllPollsHandler(req: Request, res: Response): Promise<void> {
  const result = await adminListAllPolls(req.query as Record<string, string | undefined>);
  successResponse(res, 'All polls retrieved', result.data, 200, result.meta);
}

export async function adminUpdatePollHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updatePollSchema.parse({ body: req.body });
  const poll = await adminUpdatePoll(id, parsed.body);
  successResponse(res, 'Poll updated', poll);
}

export async function adminDeletePollHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await adminDeletePoll(id);
  successResponse(res, result.message);
}

export async function adminGetPollResultsHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const poll = await adminGetPollResults(id);
  successResponse(res, 'Poll results retrieved', poll);
}
