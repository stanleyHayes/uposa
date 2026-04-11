import { Request, Response } from 'express';
import {
  listActiveSchoolLeaders,
  listAllSchoolLeaders,
  getSchoolLeaderById,
  createSchoolLeader,
  updateSchoolLeader,
  deleteSchoolLeader,
} from './school-leaders.service';
import { successResponse, errorResponse } from '../../utils/response.utils';
import { uploadToCloudinary } from '../../utils/cloudinary.utils';

// Public
export async function listSchoolLeadersHandler(_req: Request, res: Response): Promise<void> {
  const leaders = await listActiveSchoolLeaders();
  successResponse(res, 'School leaders retrieved', leaders);
}

// Admin
export async function adminListSchoolLeadersHandler(_req: Request, res: Response): Promise<void> {
  const leaders = await listAllSchoolLeaders();
  successResponse(res, 'All school leaders retrieved', leaders);
}

export async function adminGetSchoolLeaderHandler(req: Request, res: Response): Promise<void> {
  const leader = await getSchoolLeaderById(req.params.id);
  successResponse(res, 'School leader retrieved', leader);
}

export async function adminCreateSchoolLeaderHandler(req: Request, res: Response): Promise<void> {
  const { name, position, order, isActive } = req.body;

  if (!name || !position) {
    errorResponse(res, 'Name and position are required', 400);
    return;
  }

  let photoUrl: string | undefined;
  if (req.file) {
    photoUrl = await uploadToCloudinary(req.file, 'school-leaders');
  }

  const leader = await createSchoolLeader({
    name,
    position,
    photoUrl,
    order: order !== undefined ? parseInt(order, 10) : undefined,
    isActive: isActive !== undefined ? isActive === 'true' || isActive === true : undefined,
  });
  successResponse(res, 'School leader created', leader, 201);
}

export async function adminUpdateSchoolLeaderHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, position, order, isActive } = req.body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (position !== undefined) data.position = position;
  if (order !== undefined) data.order = parseInt(order, 10);
  if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true;

  if (req.file) {
    data.photoUrl = await uploadToCloudinary(req.file, 'school-leaders');
  }

  const leader = await updateSchoolLeader(id, data);
  successResponse(res, 'School leader updated', leader);
}

export async function adminDeleteSchoolLeaderHandler(req: Request, res: Response): Promise<void> {
  const result = await deleteSchoolLeader(req.params.id);
  successResponse(res, result.message);
}
