import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getDashboardStats,
  listAdmins,
  createAdmin,
  updateAdmin,
  deactivateAdmin,
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

export async function getDashboardStatsHandler(_req: Request, res: Response): Promise<void> {
  const stats = await getDashboardStats();
  successResponse(res, 'Dashboard stats retrieved', stats);
}

export async function listAdminsHandler(req: Request, res: Response): Promise<void> {
  const result = await listAdmins(req.query as Record<string, string | undefined>);
  successResponse(res, 'Admins retrieved', result.data, 200, result.meta);
}

export async function createAdminHandler(req: Request, res: Response): Promise<void> {
  const parsed = createAdminSchema.parse({ body: req.body });
  const admin = await createAdmin(parsed.body);
  successResponse(res, 'Admin created successfully', admin, 201);
}

export async function updateAdminHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updateAdminSchema.parse({ body: req.body });
  const admin = await updateAdmin(id, parsed.body);
  successResponse(res, 'Admin updated', admin);
}

export async function deactivateAdminHandler(req: Request, res: Response): Promise<void> {
  if (!req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const { id } = req.params;
  const result = await deactivateAdmin(id, req.admin.id);
  successResponse(res, 'Admin deactivated', result);
}
