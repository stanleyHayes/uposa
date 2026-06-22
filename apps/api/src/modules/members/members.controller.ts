import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import {
  updateProfileSchema,
  listMembersQuerySchema,
  adminUpdateMemberStatusSchema,
} from './members.validation';
import {
  listMembers,
  getMemberDirectory,
  getMemberById,
  updateProfile,
  updateProfilePhoto,
  getMyDues,
  getMyDonations,
  adminListMembers,
  adminGetMemberById,
  approveMember,
  suspendMember,
  changeMemberStatus,
  deleteMember,
} from './members.service';
import { successResponse, errorResponse } from '../../utils/response.utils';
import { uploadToCloudinary } from '../../utils/cloudinary.utils';

export async function listMembersHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = listMembersQuerySchema.parse({ query: req.query });
  const result = await listMembers(parsed.query as Record<string, string | undefined>);
  successResponse(res, 'Members retrieved', result.data, 200, result.meta);
}

export async function getMemberDirectoryHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = listMembersQuerySchema.parse({ query: req.query });
  const result = await getMemberDirectory(parsed.query as Record<string, string | undefined>);
  successResponse(res, 'Member directory retrieved', result.data, 200, result.meta);
}

export async function getMemberByIdHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const { id } = req.params;
  const member = await getMemberById(id, req.user.id);
  successResponse(res, 'Member retrieved', member);
}

export async function updateProfileHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const parsed = updateProfileSchema.parse({ body: req.body });
  const member = await updateProfile(req.user.id, parsed.body);
  successResponse(res, 'Profile updated', member);
}

export async function uploadProfilePhotoHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  if (!req.file) {
    errorResponse(res, 'No photo uploaded', 400);
    return;
  }
  const photoUrl = await uploadToCloudinary(req.file, 'members');
  const member = await updateProfilePhoto(req.user.id, photoUrl);
  successResponse(res, 'Profile photo updated', member);
}

export async function getMyDuesHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const result = await getMyDues(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Dues retrieved', result.data, 200, result.meta);
}

export async function getMyDonationsHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const result = await getMyDonations(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Donations retrieved', result.data, 200, result.meta);
}

// Admin handlers
export async function adminListMembersHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await adminListMembers(req.query as Record<string, string | undefined>);
  successResponse(res, 'Members retrieved', result.data, 200, result.meta);
}

export async function adminGetMemberByIdHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const member = await adminGetMemberById(id);
  successResponse(res, 'Member retrieved', member);
}

export async function approveMemberHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const member = await approveMember(id);
  successResponse(res, 'Member approved successfully', member);
}

export async function suspendMemberHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const member = await suspendMember(id);
  successResponse(res, 'Member suspended', member);
}

export async function changeMemberStatusHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = adminUpdateMemberStatusSchema.parse({ body: req.body });
  const member = await changeMemberStatus(id, parsed.body.membershipStatus);
  successResponse(res, 'Member status updated', member);
}

export async function deleteMemberHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await deleteMember(id);
  successResponse(res, result.message);
}
