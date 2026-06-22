import { escapeRegex } from '../../utils/search.utils';
import mongoose from 'mongoose';
import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { sendApprovalEmail } from '../../utils/email.utils';
import { UpdateProfileInput } from './members.validation';

const SAFE_MEMBER_PROJECTION = '-password -verificationToken -resetToken -resetTokenExpiry';

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
  const where = buildMemberFilter(query, { membershipStatus: 'ACTIVE', isApproved: true });

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
  const where: Record<string, unknown> = { membershipStatus: 'ACTIVE', isApproved: true };
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
    return self;
  }

  const member = await members.findOne(
    { _id: id, membershipStatus: 'ACTIVE', isApproved: true },
    { projection: DIRECTORY_PROJECTION },
  );
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  return member;
}

export async function updateProfile(memberId: string, data: UpdateProfileInput) {
  const { members } = getRepos();
  const updateData: Record<string, unknown> = { ...data };
  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  }

  const result = await members.updateById(memberId, updateData);
  if (!result) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safe } = result as any;
  return safe;
}

export async function updateProfilePhoto(memberId: string, photoUrl: string) {
  const { members } = getRepos();
  const result = await members.updateById(memberId, { photoUrl });
  if (!result) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safe } = result as any;
  return safe;
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

  const where: Record<string, unknown> = {};
  if (status && status !== 'all') where.membershipStatus = status.toUpperCase();
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
  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safeData } = member as any;
  return safeData;
}

export async function approveMember(id: string) {
  const { members } = getRepos();
  const member = await members.findById(id);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

  const result = await members.updateById(id, {
    isApproved: true,
    approvedAt: new Date(),
    membershipStatus: 'ACTIVE',
  });

  try {
    await sendApprovalEmail((member as any).email, (member as any).fullName);
  } catch (err) {
    console.error('Failed to send approval email:', err);
  }

  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safe } = result as any;
  return safe;
}

export async function suspendMember(id: string) {
  const { members } = getRepos();
  const member = await members.findById(id);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

  const result = await members.updateById(id, { membershipStatus: 'SUSPENDED' });
  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safe } = result as any;
  return safe;
}

export async function changeMemberStatus(id: string, status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE') {
  const { members } = getRepos();
  const member = await members.findById(id);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

  const result = await members.updateById(id, { membershipStatus: status });
  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safe } = result as any;
  return safe;
}

export async function deleteMember(id: string) {
  const { members } = getRepos();
  const member = await members.findById(id);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  await members.deleteById(id);
  return { message: 'Member deleted successfully' };
}
