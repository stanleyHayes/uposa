import { Request, Response } from 'express';
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

export async function listMembersHandler(req: Request, res: Response): Promise<void> {
  const parsed = listMembersQuerySchema.parse({ query: req.query });
  const result = await listMembers(parsed.query as Record<string, string | undefined>);
  successResponse(res, 'Members retrieved', result.data, 200, result.meta);
}

export async function getMemberDirectoryHandler(req: Request, res: Response): Promise<void> {
  const parsed = listMembersQuerySchema.parse({ query: req.query });
  const result = await getMemberDirectory(parsed.query as Record<string, string | undefined>);
  successResponse(res, 'Member directory retrieved', result.data, 200, result.meta);
}

export async function getMemberByIdHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const member = await getMemberById(id);
  successResponse(res, 'Member retrieved', member);
}

export async function updateProfileHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const parsed = updateProfileSchema.parse({ body: req.body });
  const member = await updateProfile(req.user.id, parsed.body);
  successResponse(res, 'Profile updated', member);
}

export async function uploadProfilePhotoHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  if (!req.file) {
    errorResponse(res, 'No photo uploaded', 400);
    return;
  }
  const photoUrl = `/uploads/${req.file.filename}`;
  const member = await updateProfilePhoto(req.user.id, photoUrl);
  successResponse(res, 'Profile photo updated', member);
}

export async function getMyDuesHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const result = await getMyDues(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Dues retrieved', result.data, 200, result.meta);
}

export async function getMyDonationsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const result = await getMyDonations(req.user.id, req.query as Record<string, string | undefined>);
  successResponse(res, 'Donations retrieved', result.data, 200, result.meta);
}

// Admin handlers
export async function adminListMembersHandler(req: Request, res: Response): Promise<void> {
  const result = await adminListMembers(req.query as Record<string, string | undefined>);
  successResponse(res, 'Members retrieved', result.data, 200, result.meta);
}

export async function adminGetMemberByIdHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const member = await adminGetMemberById(id);
  successResponse(res, 'Member retrieved', member);
}

export async function approveMemberHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const member = await approveMember(id);
  successResponse(res, 'Member approved successfully', member);
}

export async function suspendMemberHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const member = await suspendMember(id);
  successResponse(res, 'Member suspended', member);
}

export async function changeMemberStatusHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = adminUpdateMemberStatusSchema.parse({ body: req.body });
  const member = await changeMemberStatus(id, parsed.body.membershipStatus);
  successResponse(res, 'Member status updated', member);
}

export async function deleteMemberHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await deleteMember(id);
  successResponse(res, result.message);
}
