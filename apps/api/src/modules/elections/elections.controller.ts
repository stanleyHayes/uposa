import { Request, Response } from 'express';
import {
  createElectionSchema,
  changeElectionStatusSchema,
  castElectionVoteSchema,
  updateElectionSchema,
} from './elections.validation';
import {
  listElections,
  getElectionById,
  castVote,
  createElection,
  changeElectionStatus,
  getElectionResults,
  adminListAllElections,
  adminDeleteElection,
  adminUpdateElection,
} from './elections.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

// Member handlers
export async function listElectionsHandler(req: Request, res: Response): Promise<void> {
  const result = await listElections(req.query as Record<string, string | undefined>);
  successResponse(res, 'Elections retrieved', result.data, 200, result.meta);
}

export async function getElectionByIdHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const election = await getElectionById(id, req.user.id);
  successResponse(res, 'Election retrieved', election);
}

export async function castVoteHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const parsed = castElectionVoteSchema.parse({ body: req.body });
  const result = await castVote(id, req.user.id, parsed.body);
  successResponse(res, result.message);
}

// Admin handlers
export async function createElectionHandler(req: Request, res: Response): Promise<void> {
  if (!req.admin) { errorResponse(res, 'Unauthorized', 401); return; }
  const parsed = createElectionSchema.parse({ body: req.body });
  const election = await createElection(req.admin.id, parsed.body);
  successResponse(res, 'Election created successfully', election, 201);
}

export async function changeElectionStatusHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = changeElectionStatusSchema.parse({ body: req.body });
  const election = await changeElectionStatus(id, parsed.body);
  successResponse(res, 'Election status updated', election);
}

export async function getElectionResultsHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const results = await getElectionResults(id);
  successResponse(res, 'Election results retrieved', results);
}

export async function adminListAllElectionsHandler(req: Request, res: Response): Promise<void> {
  const result = await adminListAllElections(req.query as Record<string, string | undefined>);
  successResponse(res, 'All elections retrieved', result.data, 200, result.meta);
}

export async function adminDeleteElectionHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await adminDeleteElection(id);
  successResponse(res, result.message);
}

export async function adminUpdateElectionHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updateElectionSchema.parse({ body: req.body });
  const election = await adminUpdateElection(id, parsed.body);
  successResponse(res, 'Election updated', election);
}
