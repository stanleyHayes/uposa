import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { z } from 'zod';
import {
  getDashboardStats,
  listAdmins,
  createAdmin,
  updateAdmin,
  updateOwnProfile,
  deactivateAdmin,
  changeAdminPassword,
} from './admin.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

const createAdminSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']).optional(),
  }),
});

const updateAdminSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']).optional(),
    isActive: z.boolean().optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export async function getDashboardStatsHandler(req: RouteRequest, res: Response): Promise<void> {
  const stats = await getDashboardStats();
  successResponse(res, 'Dashboard stats retrieved', stats);
}

export async function listAdminsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await listAdmins(req.query as Record<string, string | undefined>);
  successResponse(res, 'Admins retrieved', result.data, 200, result.meta);
}

export async function createAdminHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = createAdminSchema.parse({ body: req.body });
  const admin = await createAdmin(parsed.body);
  successResponse(res, 'Admin created successfully', admin, 201);
}

export async function updateAdminHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updateAdminSchema.parse({ body: req.body });
  const admin = await updateAdmin(id, parsed.body);
  successResponse(res, 'Admin updated', admin);
}

export async function deactivateAdminHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const { id } = req.params;
  const result = await deactivateAdmin(id, req.admin.id);
  successResponse(res, 'Admin deactivated', result);
}

const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name is required').optional(),
    email: z.string().email('Invalid email').optional(),
  }),
});

export async function updateProfileHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const parsed = updateProfileSchema.parse({ body: req.body });
  const admin = await updateOwnProfile(req.admin.id, parsed.body);
  successResponse(res, 'Profile updated', admin);
}

export async function changePasswordHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const parsed = changePasswordSchema.parse({ body: req.body });
  const result = await changeAdminPassword(req.admin.id, parsed.body.currentPassword, parsed.body.newPassword);
  successResponse(res, result.message);
}
