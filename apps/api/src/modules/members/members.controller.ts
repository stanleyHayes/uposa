import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import {
  updateProfileSchema,
  listMembersQuerySchema,
  adminUpdateMemberStatusSchema,
  updatePreferencesSchema,
  deleteAccountSchema,
} from './members.validation';
import { updateMyPreferences, exportMyData, deleteMyAccount } from './privacy.service';
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
import { hasPermission, ensurePermission } from '../../middleware/admin.middleware';
import { forbiddenMessage } from '../../config/permissions';

/** PENDING → INACTIVE is rejecting a registration (registrations:edit), not a member-status change. */
export function isRegistrationRejection(currentStatus: string | undefined, newStatus: string): boolean {
  return currentStatus === 'PENDING' && newStatus === 'INACTIVE';
}
import { uploadToCloudinary } from '../../utils/cloudinary.utils';

export async function listMembersHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = listMembersQuerySchema.parse({ query: req.query });
  const result = await listMembers(parsed.query as Record<string, string | undefined>, req.user?.id);
  successResponse(res, 'Members retrieved', result.data, 200, result.meta);
}

export async function getMemberDirectoryHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = listMembersQuerySchema.parse({ query: req.query });
  const result = await getMemberDirectory(parsed.query as Record<string, string | undefined>, req.user?.id);
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
  const query = req.query as Record<string, string | undefined>;
  // Registrations-only reviewers (no members:view) see pending registrations only.
  const scoped = hasPermission(req, 'members:view') ? query : { ...query, status: 'PENDING' };
  const result = await adminListMembers(scoped);
  successResponse(res, 'Members retrieved', result.data, 200, result.meta);
}

export async function adminGetMemberByIdHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const member = await adminGetMemberById(id);
  if (!hasPermission(req, 'members:view') && member.membershipStatus !== 'PENDING') {
    errorResponse(res, forbiddenMessage('members:view'), 403);
    return;
  }
  successResponse(res, 'Member retrieved', member);
}

export async function approveMemberHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const member = await approveMember(id, { canReinstate: hasPermission(req, 'members:edit') });
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
  const current = await adminGetMemberById(id);
  ensurePermission(req, isRegistrationRejection(current.membershipStatus, parsed.body.membershipStatus) ? 'registrations:edit' : 'members:edit');
  const member = await changeMemberStatus(id, parsed.body.membershipStatus, parsed.body.rejectionReason || parsed.body.reason);
  successResponse(res, 'Member status updated', member);
}

export async function deleteMemberHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await deleteMember(id);
  successResponse(res, result.message);
}

// ── Privacy self-service (Act 843) ──

export async function updatePreferencesHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const parsed = updatePreferencesSchema.parse({ body: req.body });
  const preferences = await updateMyPreferences(req.user.id, parsed.body);
  successResponse(res, 'Preferences updated', preferences);
}

export async function exportMyDataHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const data = await exportMyData(req.user.id);
  const date = data.generatedAt.slice(0, 10); // YYYY-MM-DD (UTC)
  res.setHeader('Content-Disposition', `attachment; filename="uposa-my-data-${date}.json"`);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(data);
}

export async function deleteMyAccountHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const parsed = deleteAccountSchema.parse({ body: req.body });
  const result = await deleteMyAccount(req.user.id, parsed.body.password);
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  successResponse(res, result.message);
}
