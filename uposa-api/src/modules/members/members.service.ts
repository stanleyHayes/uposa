import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { sendApprovalEmail } from '../../utils/email.utils';
import { UpdateProfileInput } from './members.validation';

const SAFE_MEMBER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  gender: true,
  dateOfBirth: true,
  maritalStatus: true,
  photoUrl: true,
  mobileNumber: true,
  altPhoneNumber: true,
  residentialAddress: true,
  city: true,
  country: true,
  yearGroup: true,
  programme: true,
  house: true,
  employmentType: true,
  occupation: true,
  organization: true,
  areaOfExpertise: true,
  emergencyContactNumber: true,
  emergencyRelationship: true,
  nextOfKinName: true,
  nextOfKinContact: true,
  nextOfKinRelationship: true,
  isAvailableAsMentor: true,
  mentorBio: true,
  isWhatsAppMember: true,
  willingToVolunteer: true,
  preferredContributions: true,
  membershipStatus: true,
  isApproved: true,
  approvedAt: true,
  consentGiven: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
};

const DIRECTORY_SELECT = {
  id: true,
  fullName: true,
  photoUrl: true,
  yearGroup: true,
  programme: true,
  house: true,
  city: true,
  country: true,
  occupation: true,
  organization: true,
  areaOfExpertise: true,
  willingToVolunteer: true,
};

export async function listMembers(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { yearGroup, house, programme, country, search } = query;

  const where: Record<string, unknown> = {
    membershipStatus: 'ACTIVE',
    isApproved: true,
  };

  if (yearGroup) where.yearGroup = parseInt(yearGroup, 10);
  if (house) where.house = house;
  if (programme) where.programme = programme;
  if (country) where.country = { contains: country, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { occupation: { contains: search, mode: 'insensitive' } },
      { organization: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.member.findMany({
      where,
      select: SAFE_MEMBER_SELECT,
      skip,
      take: limit,
      orderBy: { fullName: 'asc' },
    }),
    prisma.member.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getMemberDirectory(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { yearGroup, house, programme, country, search } = query;

  const where: Record<string, unknown> = {
    membershipStatus: 'ACTIVE',
    isApproved: true,
  };

  if (yearGroup) where.yearGroup = parseInt(yearGroup, 10);
  if (house) where.house = house;
  if (programme) where.programme = programme;
  if (country) where.country = { contains: country, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { occupation: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.member.findMany({
      where,
      select: DIRECTORY_SELECT,
      skip,
      take: limit,
      orderBy: { fullName: 'asc' },
    }),
    prisma.member.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getMemberById(id: string) {
  const member = await prisma.member.findUnique({
    where: { id },
    select: SAFE_MEMBER_SELECT,
  });
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  return member;
}

export async function updateProfile(memberId: string, data: UpdateProfileInput) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  }

  const member = await prisma.member.update({
    where: { id: memberId },
    data: updateData,
    select: SAFE_MEMBER_SELECT,
  });
  return member;
}

export async function updateProfilePhoto(memberId: string, photoUrl: string) {
  return prisma.member.update({
    where: { id: memberId },
    data: { photoUrl },
    select: SAFE_MEMBER_SELECT,
  });
}

export async function getMyDues(memberId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.due.findMany({
      where: { memberId },
      skip,
      take: limit,
      orderBy: { year: 'desc' },
    }),
    prisma.due.count({ where: { memberId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getMyDonations(memberId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.donation.findMany({
      where: { memberId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, title: true } } },
    }),
    prisma.donation.count({ where: { memberId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

// Admin services
export async function adminListMembers(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search, yearGroup, house, programme } = query;

  const where: Record<string, unknown> = {};
  if (status && status !== 'all') where.membershipStatus = status.toUpperCase();
  if (yearGroup) where.yearGroup = parseInt(yearGroup, 10);
  if (house) where.house = house;
  if (programme) where.programme = programme;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.member.findMany({
      where,
      select: SAFE_MEMBER_SELECT,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.member.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminGetMemberById(id: string) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  const { password: _pw, verificationToken: _vt, resetToken: _rt, resetTokenExpiry: _rte, ...safeData } = member;
  return safeData;
}

export async function approveMember(id: string) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

  const updated = await prisma.member.update({
    where: { id },
    data: {
      isApproved: true,
      approvedAt: new Date(),
      membershipStatus: 'ACTIVE',
    },
    select: SAFE_MEMBER_SELECT,
  });

  try {
    await sendApprovalEmail(member.email, member.fullName);
  } catch (err) {
    console.error('Failed to send approval email:', err);
  }

  return updated;
}

export async function suspendMember(id: string) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

  return prisma.member.update({
    where: { id },
    data: { membershipStatus: 'SUSPENDED' },
    select: SAFE_MEMBER_SELECT,
  });
}

export async function changeMemberStatus(id: string, status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE') {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

  return prisma.member.update({
    where: { id },
    data: { membershipStatus: status },
    select: SAFE_MEMBER_SELECT,
  });
}

export async function deleteMember(id: string) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  await prisma.member.delete({ where: { id } });
  return { message: 'Member deleted successfully' };
}
