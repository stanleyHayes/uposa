import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { createProjectSchema, updateProjectSchema } from './projects.validation';
import {
  listProjects,
  getOngoingProjects,
  getCompletedProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
} from './projects.service';
import { successResponse, errorResponse } from '../../utils/response.utils';
import { uploadToCloudinary } from '../../utils/cloudinary.utils';

export async function listProjectsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await listProjects(req.query as Record<string, string | undefined>);
  successResponse(res, 'Projects retrieved', result.data, 200, result.meta);
}

export async function getOngoingProjectsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await getOngoingProjects(req.query as Record<string, string | undefined>);
  successResponse(res, 'Ongoing projects retrieved', result.data, 200, result.meta);
}

export async function getCompletedProjectsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await getCompletedProjects(req.query as Record<string, string | undefined>);
  successResponse(res, 'Completed projects retrieved', result.data, 200, result.meta);
}

export async function getProjectBySlugHandler(req: RouteRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const project = await getProjectBySlug(slug);
  successResponse(res, 'Project retrieved', project);
}

function parseFormDataBody(body: Record<string, unknown>): Record<string, unknown> {
  const result = { ...body };
  // Parse JSON string fields from FormData
  if (typeof result.gallery === 'string') {
    try { result.gallery = JSON.parse(result.gallery); } catch { result.gallery = []; }
  }
  if (typeof result.milestones === 'string') {
    try { result.milestones = JSON.parse(result.milestones); } catch { result.milestones = []; }
  }
  // Coerce boolean strings
  if (typeof result.isFeatured === 'string') {
    result.isFeatured = result.isFeatured === 'true';
  }
  return result;
}

export async function createProjectHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const body = parseFormDataBody(req.body);
  const parsed = createProjectSchema.parse({ body });
  const imageUrl = req.file ? await uploadToCloudinary(req.file, 'projects') : undefined;
  const project = await createProject(req.admin.id, parsed.body, imageUrl);
  successResponse(res, 'Project created successfully', project, 201);
}

export async function updateProjectHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const body = parseFormDataBody(req.body);
  const parsed = updateProjectSchema.parse({ body });
  const imageUrl = req.file ? await uploadToCloudinary(req.file, 'projects') : undefined;
  const project = await updateProject(id, parsed.body, imageUrl);
  successResponse(res, 'Project updated successfully', project);
}

export async function deleteProjectHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await deleteProject(id);
  successResponse(res, result.message);
}
