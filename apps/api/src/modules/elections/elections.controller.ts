import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
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
export async function listElectionsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await listElections(req.query as Record<string, string | undefined>);
  successResponse(res, 'Elections retrieved', result.data, 200, result.meta);
}

export async function getElectionByIdHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const election = await getElectionById(id, req.user.id);
  successResponse(res, 'Election retrieved', election);
}

export async function castVoteHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const parsed = castElectionVoteSchema.parse({ body: req.body });
  const result = await castVote(id, req.user.id, parsed.body);
  successResponse(res, result.message);
}

// Admin handlers
export async function createElectionHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.admin) { errorResponse(res, 'Unauthorized', 401); return; }
  const parsed = createElectionSchema.parse({ body: req.body });
  const election = await createElection(req.admin.id, parsed.body);
  successResponse(res, 'Election created successfully', election, 201);
}

export async function changeElectionStatusHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = changeElectionStatusSchema.parse({ body: req.body });
  const election = await changeElectionStatus(id, parsed.body);
  successResponse(res, 'Election status updated', election);
}

export async function getElectionResultsHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const results = await getElectionResults(id);
  successResponse(res, 'Election results retrieved', results);
}

export async function adminListAllElectionsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await adminListAllElections(req.query as Record<string, string | undefined>);
  successResponse(res, 'All elections retrieved', result.data, 200, result.meta);
}

export async function adminDeleteElectionHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await adminDeleteElection(id);
  successResponse(res, result.message);
}

export async function adminUpdateElectionHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updateElectionSchema.parse({ body: req.body });
  const election = await adminUpdateElection(id, parsed.body);
  successResponse(res, 'Election updated', election);
}
