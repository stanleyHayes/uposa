import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { SendMentorshipRequestInput, RespondToRequestInput, ToggleMentorAvailabilityInput } from './mentorship.validation';

export async function listMentors(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { areaOfExpertise, search } = query;

  const where: Record<string, unknown> = {
    membershipStatus: 'ACTIVE',
    isApproved: true,
    isAvailableAsMentor: true,
  };

  if (areaOfExpertise) {
    where.areaOfExpertise = { has: areaOfExpertise };
  }
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
      skip,
      take: limit,
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        photoUrl: true,
        occupation: true,
        organization: true,
        areaOfExpertise: true,
        yearGroup: true,
        programme: true,
        mentorBio: true,
      },
    }),
    prisma.member.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function toggleMentorAvailability(memberId: string, data: ToggleMentorAvailabilityInput) {
  return prisma.member.update({
    where: { id: memberId },
    data: {
      isAvailableAsMentor: data.isAvailableAsMentor,
      mentorBio: data.mentorBio,
    },
    select: {
      id: true,
      fullName: true,
      isAvailableAsMentor: true,
      mentorBio: true,
    },
  });
}

export async function getMyMentorProfile(memberId: string) {
  return prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      fullName: true,
      isAvailableAsMentor: true,
      mentorBio: true,
      areaOfExpertise: true,
      occupation: true,
      organization: true,
    },
  });
}

export async function sendMentorshipRequest(menteeId: string, data: SendMentorshipRequestInput) {
  if (menteeId === data.mentorId) {
    throw Object.assign(new Error('You cannot request mentorship from yourself'), { statusCode: 400 });
  }

  const mentor = await prisma.member.findUnique({ where: { id: data.mentorId } });
  if (!mentor) throw Object.assign(new Error('Mentor not found'), { statusCode: 404 });
  if (!mentor.isAvailableAsMentor) {
    throw Object.assign(new Error('This member is not currently available as a mentor'), { statusCode: 400 });
  }

  const existing = await prisma.mentorshipRequest.findFirst({
    where: { menteeId, mentorId: data.mentorId, status: 'PENDING' },
  });
  if (existing) {
    throw Object.assign(new Error('You already have a pending request with this mentor'), { statusCode: 409 });
  }

  return prisma.mentorshipRequest.create({
    data: {
      mentorId: data.mentorId,
      menteeId,
      message: data.message,
      status: 'PENDING',
    },
    include: {
      mentor: { select: { id: true, fullName: true, photoUrl: true, occupation: true } },
      mentee: { select: { id: true, fullName: true, photoUrl: true } },
    },
  });
}

export async function getMyMenteeRequests(menteeId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.mentorshipRequest.findMany({
      where: { menteeId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        mentor: { select: { id: true, fullName: true, photoUrl: true, occupation: true } },
      },
    }),
    prisma.mentorshipRequest.count({ where: { menteeId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getMyMentorRequests(mentorId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.mentorshipRequest.findMany({
      where: { mentorId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        mentee: { select: { id: true, fullName: true, photoUrl: true } },
      },
    }),
    prisma.mentorshipRequest.count({ where: { mentorId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function respondToRequest(requestId: string, mentorId: string, data: RespondToRequestInput) {
  const request = await prisma.mentorshipRequest.findUnique({ where: { id: requestId } });
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });
  if (request.mentorId !== mentorId) {
    throw Object.assign(new Error('Not authorized to respond to this request'), { statusCode: 403 });
  }
  if (request.status !== 'PENDING') {
    throw Object.assign(new Error('Request has already been responded to'), { statusCode: 400 });
  }

  return prisma.mentorshipRequest.update({
    where: { id: requestId },
    data: {
      status: data.status,
      mentorResponse: data.mentorResponse,
    },
    include: {
      mentor: { select: { id: true, fullName: true, photoUrl: true } },
      mentee: { select: { id: true, fullName: true, photoUrl: true } },
    },
  });
}

// Admin services
export async function adminListMentorshipRequests(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search } = query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (search) {
    where.OR = [
      { mentor: { fullName: { contains: search, mode: 'insensitive' } } },
      { mentee: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.mentorshipRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        mentor: { select: { id: true, fullName: true, email: true, photoUrl: true, occupation: true } },
        mentee: { select: { id: true, fullName: true, email: true, photoUrl: true } },
      },
    }),
    prisma.mentorshipRequest.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminListMentors(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const where = { isAvailableAsMentor: true, membershipStatus: 'ACTIVE' as const };

  const [data, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        photoUrl: true,
        occupation: true,
        organization: true,
        areaOfExpertise: true,
        mentorBio: true,
        yearGroup: true,
        _count: { select: { mentorRequests: true } },
      },
    }),
    prisma.member.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminDeleteMentorshipRequest(requestId: string) {
  const request = await prisma.mentorshipRequest.findUnique({ where: { id: requestId } });
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });
  await prisma.mentorshipRequest.delete({ where: { id: requestId } });
  return { message: 'Mentorship request deleted successfully' };
}
