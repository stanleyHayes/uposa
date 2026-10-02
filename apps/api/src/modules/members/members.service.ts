import { escapeRegex } from '../../utils/search.utils';
import mongoose from 'mongoose';
import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { sendApprovalEmail } from '../../utils/email.utils';
import { DIRECTORY_VISIBLE_FILTER, SAFE_MEMBER_PROJECTION, toMemberView } from '../../utils/privacy.utils';
import { invalidateMemberSession } from '../../utils/session-state.utils';
import { UpdateProfileInput } from './members.validation';

// Listed to other members only if active, approved and opted in to the
// directory (accounts that predate consents count as opted in).
const DIRECTORY_BASE = { membershipStatus: 'ACTIVE', isApproved: true, ...DIRECTORY_VISIBLE_FILTER };

const DIRECTORY_PROJECTION = 'fullName photoUrl yearGroup programme house city country occupation organization areaOfExpertise willingToVolunteer';

function buildMemberFilter(query: Record<string, string | undefined>, base: Record<string, unknown> = {}) {
  const where: Record<string, unknown> = { ...base };
  const { yearGroup, house, programme, country, search } = query;

  if (yearGroup) where.yearGroup = parseInt(yearGroup, 10);
  if (house) where.house = house;
  if (programme) where.programme = programme;
  if (country) where.country = { $regex: escapeRegex(country), $options: 'i' };
  if (search) {
    where.$or = [
      { fullName: { $regex: escapeRegex(search), $options: 'i' } },
      { occupation: { $regex: escapeRegex(search), $options: 'i' } },
      { organization: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }
  return where;
}

export async function listMembers(query: Record<string, string | undefined>) {
  const { members } = getRepos();
  const { page, limit, skip } = getPaginationParams(query);
  const where = buildMemberFilter(query, DIRECTORY_BASE);

  const [data, total] = await Promise.all([
    members.findMany(where, { projection: DIRECTORY_PROJECTION, sort: { fullName: 1 }, skip, limit }),
    members.count(where),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getMemberDirectory(query: Record<string, string | undefined>) {
  const { members } = getRepos();
  const { page, limit, skip } = getPaginationParams(query);
  const { search } = query;
  const where: Record<string, unknown> = { ...DIRECTORY_BASE };
  const { yearGroup, house, programme, country } = query;

  if (yearGroup) where.yearGroup = parseInt(yearGroup, 10);
  if (house) where.house = house;
  if (programme) where.programme = programme;
  if (country) where.country = { $regex: escapeRegex(country), $options: 'i' };
  if (search) {
    where.$or = [
      { fullName: { $regex: escapeRegex(search), $options: 'i' } },
      { occupation: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    members.findMany(where, { projection: DIRECTORY_PROJECTION, sort: { fullName: 1 }, skip, limit }),
    members.count(where),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getMemberById(id: string, requesterId?: string) {
  const { members } = getRepos();

  // A member may read their OWN full record. Any other member is limited to
  // directory-safe fields, and only for active, approved members — this prevents
  // IDOR PII harvesting (addresses, phone numbers, DOB, next-of-kin) across accounts.
  if (requesterId && id === requesterId) {
    const self = await members.findById(id, { projection: SAFE_MEMBER_PROJECTION });
    if (!self) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
    return toMemberView(self);
  }

  const member = await members.findOne(
    { _id: id, ...DIRECTORY_BASE },
    { projection: DIRECTORY_PROJECTION },
  );
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  return member;
}

export async function updateProfile(memberId: string, data: UpdateProfileInput) {
  const { members } = getRepos();
  // null (sent as '' or null) clears the field; omitted fields are left unchanged.
  const updateData: Record<string, unknown> = { ...data };
  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  }

  const result = await members.updateById(memberId, updateData);
  if (!result) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  return toMemberView(result);
}

export async function updateProfilePhoto(memberId: string, photoUrl: string) {
  const { members } = getRepos();
  const result = await members.updateById(memberId, { photoUrl });
  if (!result) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  return toMemberView(result);
}

export async function getMyDues(memberId: string, query: Record<string, string | undefined>) {
  const { dues } = getRepos();
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    dues.findMany({ memberId }, { sort: { year: -1 }, skip, limit }),
    dues.count({ memberId }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getMyDonations(memberId: string, query: Record<string, string | undefined>) {
  const { donations } = getRepos();
  const { page, limit, skip } = getPaginationParams(query);

  const pipeline = [
    { $match: { memberId: new mongoose.Types.ObjectId(memberId) } },
    { $sort: { createdAt: -1 as const } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'projects',
        let: { pid: '$projectId' },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: '$_id' }, { $toString: '$$pid' }] } } },
          { $project: { _id: 0, id: { $toString: '$_id' }, title: 1 } },
        ],
        as: '_project',
      },
    },
    { $addFields: { project: { $arrayElemAt: ['$_project', 0] } } },
    { $project: { _project: 0 } },
  ];

  const [data, total] = await Promise.all([
    donations.aggregate(pipeline),
    donations.count({ memberId }),
  ]);

  // Normalize _id -> id for aggregation results (plain objects)
  const normalized = data.map((d: any) => {
    const { _id, ...rest } = d;
    return { id: _id?.toString(), ...rest };
  });

  return { data: normalized, meta: buildPaginationMeta(page, limit, total) };
}

// Admin services
export async function adminListMembers(query: Record<string, string | undefined>) {
  const { members } = getRepos();
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search, yearGroup, house, programme } = query;

  // Self-deleted (anonymised) accounts are hidden unless asked for with ?status=DELETED.
  const where: Record<string, unknown> = { membershipStatus: { $ne: 'DELETED' } };
  if (status && status.toLowerCase() !== 'all') where.membershipStatus = status.toUpperCase();
  if (yearGroup) where.yearGroup = parseInt(yearGroup, 10);
  if (house) where.house = house;
  if (programme) where.programme = programme;
  if (search) {
    where.$or = [
      { fullName: { $regex: escapeRegex(search), $options: 'i' } },
      { email: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    members.findMany(where, { projection: SAFE_MEMBER_PROJECTION, sort: { createdAt: -1 }, skip, limit }),
    members.count(where),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminGetMemberById(id: string) {
  const { members } = getRepos();
  const member = await members.findById(id);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  // Includes consents, effective `preferences` and deletedAt.
  return toMemberView(member);
}

function assertNotDeleted(member: { membershipStatus?: string }) {
  if (member.membershipStatus === 'DELETED') {
    throw Object.assign(new Error('This account was deleted by the member and cannot be changed'), { statusCode: 400 });
  }
}

export async function approveMember(id: string) {
  const { members } = getRepos();
  const member = await members.findById(id);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  assertNotDeleted(member);

  const result = await members.updateById(id, {
    isApproved: true,
    approvedAt: new Date(),
    membershipStatus: 'ACTIVE',
    rejectionReason: null,
  });
  invalidateMemberSession(id);

  try {
    await sendApprovalEmail((member as any).email, (member as any).fullName);
  } catch (err) {
    console.error('Failed to send approval email:', err);
  }

  return toMemberView(result!);
}

export async function suspendMember(id: string) {
  const { members } = getRepos();
  const member = await members.findById(id);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

  assertNotDeleted(member);

  const result = await members.updateById(id, { membershipStatus: 'SUSPENDED' });
  invalidateMemberSession(id); // takes effect on their next request, not at token expiry
  return toMemberView(result!);
}

export async function changeMemberStatus(
  id: string,
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE',
  rejectionReason?: string,
) {
  const { members } = getRepos();
  const member = await members.findById(id);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  assertNotDeleted(member);

  const updates: Record<string, unknown> = { membershipStatus: status };
  // Rejecting a registration (INACTIVE) keeps the admin's reason; reactivating clears it.
  if (status === 'INACTIVE' && rejectionReason) updates.rejectionReason = rejectionReason;
  if (status === 'ACTIVE') updates.rejectionReason = null;

  const result = await members.updateById(id, updates);
  invalidateMemberSession(id);
  return toMemberView(result!);
}

export async function deleteMember(id: string) {
  const { members } = getRepos();
  const member = await members.findById(id);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  await members.deleteById(id);
  invalidateMemberSession(id);
  return { message: 'Member deleted successfully' };
}
