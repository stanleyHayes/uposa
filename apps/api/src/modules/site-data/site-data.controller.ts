import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import * as siteDataService from './site-data.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

// Public: Get all site data bundled
export async function getPublicSiteData(req: RouteRequest, res: Response) {
  const data = await siteDataService.getPublicSiteData();
  return successResponse(res, 'Site data retrieved', data);
}

// Public: Get single config
export async function getConfigByKey(req: RouteRequest, res: Response) {
  const { key } = req.params;
  const value = await siteDataService.getSiteConfigByKey(key);
  if (!value) return errorResponse(res, 'Config not found', 404);
  return successResponse(res, 'Config retrieved', { key, value });
}

// Public: Get year group reps
export async function getYearGroupReps(req: RouteRequest, res: Response) {
  const reps = await siteDataService.getYearGroupRepsGrouped();
  return successResponse(res, 'Year group reps retrieved', reps);
}

// Admin: Upsert config
export async function upsertConfig(req: RouteRequest, res: Response) {
  const { key } = req.params;
  const { value } = req.body;
  if (!value) return errorResponse(res, 'Value is required', 400);
  const config = await siteDataService.upsertSiteConfig(key, value);
  return successResponse(res, 'Config updated', config);
}

// Admin: Get all configs (for settings page)
export async function getAllConfigs(req: RouteRequest, res: Response) {
  const configs = await siteDataService.getAllSiteConfig();
  return successResponse(res, 'All configs retrieved', configs);
}

// Admin: CRUD year group reps
export async function createRep(req: RouteRequest, res: Response) {
  const rep = await siteDataService.createYearGroupRep(req.body);
  return successResponse(res, 'Rep created', rep, 201);
}

export async function updateRep(req: RouteRequest, res: Response) {
  const rep = await siteDataService.updateYearGroupRep(req.params.id, req.body);
  return successResponse(res, 'Rep updated', rep);
}

export async function deleteRep(req: RouteRequest, res: Response) {
  await siteDataService.deleteYearGroupRep(req.params.id);
  return successResponse(res, 'Rep deleted');
}

// Admin: Upload document (PDF/image) and return URL
export async function uploadDocumentHandler(req: RouteRequest, res: Response) {
  if (!req.file) return errorResponse(res, 'No file uploaded', 400);
  const fs = await import('fs/promises');
  const path = await import('path');
  const uploadsDir = path.default.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const ext = path.default.extname(req.file.originalname) || '.pdf';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  await fs.writeFile(path.default.join(uploadsDir, filename), req.file.buffer);
  return successResponse(res, 'Document uploaded', { url: `/uploads/${filename}` }, 201);
}
