import { Request, Response } from 'express';
import { createJobSchema, updateJobSchema, applyToJobSchema, updateApplicationStatusSchema } from './jobs.validation';
import {
  listJobs,
  getJobById,
  postJob,
  getMyPostings,
  updateMyJob,
  deleteMyJob,
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  adminListAllJobs,
  adminListPendingJobs,
  approveJob,
  deleteJob,
  adminGetJobApplications,
  adminUpdateApplicationStatus,
} from './jobs.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

// Public
export async function listJobsHandler(req: Request, res: Response): Promise<void> {
  const result = await listJobs(req.query as Record<string, string | undefined>);
  successResponse(res, 'Jobs retrieved', result.data, 200, result.meta);
}

export async function getJobByIdHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const job = await getJobById(id);
  successResponse(res, 'Job retrieved', job);
}

// Member - Post & Manage own jobs
export async function postJobHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const parsed = createJobSchema.parse({ body: req.body });
  const job = await postJob(req.user.id, parsed.body);
  successResponse(res, 'Job posted successfully. Pending admin approval.', job, 201);
}

export async function getMyPostingsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const result = await getMyPostings(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Your job postings retrieved', result.data, 200, result.meta);
}

export async function updateMyJobHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const parsed = updateJobSchema.parse({ body: req.body });
  const job = await updateMyJob(id, req.user.id, parsed.body);
  successResponse(res, 'Job updated successfully', job);
}

export async function deleteMyJobHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const result = await deleteMyJob(id, req.user.id);
  successResponse(res, result.message);
}

// Member - Apply for jobs
export async function applyToJobHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const parsed = applyToJobSchema.parse({ body: req.body });
  const application = await applyToJob(id, req.user.id, parsed.body);
  successResponse(res, 'Application submitted successfully', application, 201);
}

export async function getMyApplicationsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const result = await getMyApplications(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Your applications retrieved', result.data, 200, result.meta);
}

export async function getJobApplicationsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const result = await getJobApplications(id, req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Job applications retrieved', result.data, 200, result.meta);
}

export async function updateApplicationStatusHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) { errorResponse(res, 'Unauthorized', 401); return; }
  const { id } = req.params;
  const parsed = updateApplicationStatusSchema.parse({ body: req.body });
  const application = await updateApplicationStatus(id, req.user.id, parsed.body);
  successResponse(res, 'Application status updated', application);
}

// Admin
export async function adminListAllJobsHandler(req: Request, res: Response): Promise<void> {
  const result = await adminListAllJobs(req.query as Record<string, string | undefined>);
  successResponse(res, 'All jobs retrieved', result.data, 200, result.meta);
}

export async function adminListPendingJobsHandler(req: Request, res: Response): Promise<void> {
  const result = await adminListPendingJobs(req.query as Record<string, string | undefined>);
  successResponse(res, 'Pending jobs retrieved', result.data, 200, result.meta);
}

export async function approveJobHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const job = await approveJob(id);
  successResponse(res, 'Job approved', job);
}

export async function deleteJobHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await deleteJob(id);
  successResponse(res, result.message);
}

export async function adminGetJobApplicationsHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await adminGetJobApplications(id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Job applications retrieved', result.data, 200, result.meta);
}

export async function adminUpdateApplicationStatusHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updateApplicationStatusSchema.parse({ body: req.body });
  const application = await adminUpdateApplicationStatus(id, parsed.body);
  successResponse(res, 'Application status updated', application);
}
