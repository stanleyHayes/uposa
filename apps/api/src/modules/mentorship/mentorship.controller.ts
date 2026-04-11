import { Request, Response } from 'express';
import { sendMentorshipRequestSchema, respondToRequestSchema, toggleMentorAvailabilitySchema } from './mentorship.validation';
import {
  listMentors,
  toggleMentorAvailability,
  getMyMentorProfile,
  sendMentorshipRequest,
  getMyMenteeRequests,
  getMyMentorRequests,
  respondToRequest,
  adminListMentorshipRequests,
  adminListMentors,
  adminDeleteMentorshipRequest,
} from './mentorship.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

// Member handlers
export async function listMentorsHandler(req: Request, res: Response): Promise<void> {
  const result = await listMentors(req.query as Record<string, string | undefined>);
  successResponse(res, 'Mentors retrieved', result.data, 200, result.meta);
}

export async function toggleMentorAvailabilityHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const parsed = toggleMentorAvailabilitySchema.parse({ body: req.body });
  const result = await toggleMentorAvailability(req.user.id, parsed.body);
  successResponse(res, 'Mentor availability updated', result);
}

export async function getMyMentorProfileHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const profile = await getMyMentorProfile(req.user.id);
  successResponse(res, 'Mentor profile retrieved', profile);
}

export async function sendMentorshipRequestHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const parsed = sendMentorshipRequestSchema.parse({ body: req.body });
  const request = await sendMentorshipRequest(req.user.id, parsed.body);
  successResponse(res, 'Mentorship request sent', request, 201);
}

export async function getMyMenteeRequestsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const result = await getMyMenteeRequests(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Mentorship requests retrieved', result.data, 200, result.meta);
}

export async function getMyMentorRequestsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const result = await getMyMentorRequests(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Mentee requests retrieved', result.data, 200, result.meta);
}

export async function respondToRequestHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const parsed = respondToRequestSchema.parse({ body: req.body });
  const request = await respondToRequest(id, req.user.id, parsed.body);
  successResponse(res, 'Response submitted', request);
}

// Admin handlers
export async function adminListMentorshipRequestsHandler(req: Request, res: Response): Promise<void> {
  const result = await adminListMentorshipRequests(req.query as Record<string, string | undefined>);
  successResponse(res, 'Mentorship requests retrieved', result.data, 200, result.meta);
}

export async function adminListMentorsHandler(req: Request, res: Response): Promise<void> {
  const result = await adminListMentors(req.query as Record<string, string | undefined>);
  successResponse(res, 'Mentors retrieved', result.data, 200, result.meta);
}

export async function adminDeleteMentorshipRequestHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await adminDeleteMentorshipRequest(id);
  successResponse(res, result.message);
}
