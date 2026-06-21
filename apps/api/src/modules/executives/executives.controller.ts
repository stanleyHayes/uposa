import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import {
  listActiveExecutives,
  listAllExecutives,
  getExecutiveById,
  createExecutive,
  updateExecutive,
  deleteExecutive,
} from './executives.service';
import { successResponse, errorResponse } from '../../utils/response.utils';
import { uploadToCloudinary } from '../../utils/cloudinary.utils';

// Public
export async function listExecutivesHandler(req: RouteRequest, res: Response): Promise<void> {
  const executives = await listActiveExecutives();
  successResponse(res, 'Executives retrieved', executives);
}

// Admin
export async function adminListExecutivesHandler(req: RouteRequest, res: Response): Promise<void> {
  const executives = await listAllExecutives();
  successResponse(res, 'All executives retrieved', executives);
}

export async function adminGetExecutiveHandler(req: RouteRequest, res: Response): Promise<void> {
  const executive = await getExecutiveById(req.params.id);
  successResponse(res, 'Executive retrieved', executive);
}

export async function adminCreateExecutiveHandler(req: RouteRequest, res: Response): Promise<void> {
  const { name, position, classOf, email, phone, bio, order, isActive } = req.body;

  if (!name || !position) {
    errorResponse(res, 'Name and position are required', 400);
    return;
  }

  let photoUrl: string | undefined;
  if (req.file) {
    photoUrl = await uploadToCloudinary(req.file, 'executives');
  }

  const executive = await createExecutive({
    name,
    position,
    classOf: classOf || '',
    email: email || undefined,
    phone: phone || undefined,
    bio: bio || undefined,
    photoUrl,
    order: order !== undefined ? parseInt(order, 10) : undefined,
    isActive: isActive !== undefined ? isActive === 'true' || isActive === true : undefined,
  });
  successResponse(res, 'Executive created', executive, 201);
}

export async function adminUpdateExecutiveHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, position, classOf, email, phone, bio, order, isActive } = req.body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (position !== undefined) data.position = position;
  if (classOf !== undefined) data.classOf = classOf;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (bio !== undefined) data.bio = bio;
  if (order !== undefined) data.order = parseInt(order, 10);
  if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;

  if (req.file) {
    data.photoUrl = await uploadToCloudinary(req.file, 'executives');
  }

  const executive = await updateExecutive(id, data);
  successResponse(res, 'Executive updated', executive);
}

export async function adminDeleteExecutiveHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await deleteExecutive(req.params.id);
  successResponse(res, result.message);
}
