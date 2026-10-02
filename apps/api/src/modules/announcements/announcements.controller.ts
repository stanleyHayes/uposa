import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { createAnnouncementSchema, updateAnnouncementSchema } from './announcements.validation';
import {
  listPublicAnnouncements,
  listMemberAnnouncements,
  adminListAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from './announcements.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export async function listPublicAnnouncementsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await listPublicAnnouncements(req.query as Record<string, string | undefined>);
  successResponse(res, 'Announcements retrieved', result.data, 200, result.meta);
}

export async function listMemberAnnouncementsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await listMemberAnnouncements(req.query as Record<string, string | undefined>);
  successResponse(res, 'Announcements retrieved', result.data, 200, result.meta);
}

export async function adminListAnnouncementsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await adminListAnnouncements(req.query as Record<string, string | undefined>);
  successResponse(res, 'Announcements retrieved', result.data, 200, result.meta);
}

export async function adminGetAnnouncementHandler(req: RouteRequest, res: Response): Promise<void> {
  const announcement = await getAnnouncementById(req.params.id);
  successResponse(res, 'Announcement retrieved', announcement);
}

export async function adminCreateAnnouncementHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const parsed = createAnnouncementSchema.parse({ body: req.body });
  const announcement = await createAnnouncement(req.admin.id, parsed.body);
  successResponse(res, 'Announcement created successfully', announcement, 201);
}

export async function adminUpdateAnnouncementHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = updateAnnouncementSchema.parse({ body: req.body });
  const announcement = await updateAnnouncement(req.params.id, parsed.body);
  successResponse(res, 'Announcement updated successfully', announcement);
}

export async function adminDeleteAnnouncementHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await deleteAnnouncement(req.params.id);
  successResponse(res, result.message);
}
