// @ts-nocheck
import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { SendMentorshipRequestInput, RespondToRequestInput, ToggleMentorAvailabilityInput } from './mentorship.validation';

export async function listMentors(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { areaOfExpertise, search } = query;
  const { members } = getRepos();

  const where: Record<string, unknown> = {
    membershipStatus: 'ACTIVE',
    isApproved: true,
    isAvailableAsMentor: true,
  };

  if (areaOfExpertise) where.areaOfExpertise = areaOfExpertise;
  if (search) {
    where.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { occupation: { $regex: search, $options: 'i' } },
      { organization: { $regex: search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    members.findMany(where, {
      projection: 'fullName photoUrl occupation organization areaOfExpertise yearGroup programme mentorBio',
      sort: { fullName: 1 }, skip, limit,
    }),
    members.count(where),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function toggleMentorAvailability(memberId: string, data: ToggleMentorAvailabilityInput) {
  const { members } = getRepos();
  const result = await members.updateById(memberId, {
    isAvailableAsMentor: data.isAvailableAsMentor,
    mentorBio: data.mentorBio,
  });
  return { id: result.id, fullName: (result as any).fullName, isAvailableAsMentor: (result as any).isAvailableAsMentor, mentorBio: (result as any).mentorBio };
}

export async function getMyMentorProfile(memberId: string) {
  const { members } = getRepos();
  const m = await members.findById(memberId, {
    projection: 'fullName isAvailableAsMentor mentorBio areaOfExpertise occupation organization',
  });
  return m || null;
}

async function attachMentorMentee(doc: Record<string, any>) {
  const { members } = getRepos();
  const [mentor, mentee] = await Promise.all([
    doc.mentorId ? members.findById(doc.mentorId, { projection: 'fullName photoUrl occupation' }) : null,
    doc.menteeId ? members.findById(doc.menteeId, { projection: 'fullName photoUrl' }) : null,
  ]);
  return {
    ...doc,
    mentor: mentor ? { id: mentor.id, fullName: (mentor as any).fullName, photoUrl: (mentor as any).photoUrl, occupation: (mentor as any).occupation } : null,
    mentee: mentee ? { id: mentee.id, fullName: (mentee as any).fullName, photoUrl: (mentee as any).photoUrl } : null,
  };
}

export async function sendMentorshipRequest(menteeId: string, data: SendMentorshipRequestInput) {
  const { members, mentorshipRequests } = getRepos();

  if (menteeId === data.mentorId) {
    throw Object.assign(new Error('You cannot request mentorship from yourself'), { statusCode: 400 });
  }

  const mentor = await members.findById(data.mentorId);
  if (!mentor) throw Object.assign(new Error('Mentor not found'), { statusCode: 404 });
  if (!(mentor as any).isAvailableAsMentor) {
    throw Object.assign(new Error('This member is not currently available as a mentor'), { statusCode: 400 });
  }

  const existing = await mentorshipRequests.findOne({ menteeId, mentorId: data.mentorId, status: 'PENDING' });
  if (existing) {
    throw Object.assign(new Error('You already have a pending request with this mentor'), { statusCode: 409 });
  }

  const request = await mentorshipRequests.create({
    mentorId: data.mentorId,
    menteeId,
    message: data.message || null,
    mentorResponse: null,
    status: 'PENDING',
  });

  const withRelations = await attachMentorMentee(request);
  return withRelations;
}

export async function getMyMenteeRequests(menteeId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { members,  mentorshipRequests } = getRepos();

  const [data, total] = await Promise.all([
    mentorshipRequests.findMany({ menteeId }, { sort: { createdAt: -1 }, skip, limit }),
    mentorshipRequests.count({ menteeId }),
  ]);

  // Attach mentor info
  const mentorIds = [...new Set(data.map((d: any) => d.mentorId).filter(Boolean))];
  const mentorDocs = mentorIds.length > 0
    ? await members.findMany({ _id: { $in: mentorIds } }, { projection: 'fullName photoUrl occupation' })
    : [];
  const mentorMap = new Map(mentorDocs.map((m: any) => [m.id, { id: m.id, fullName: m.fullName, photoUrl: m.photoUrl, occupation: m.occupation }]));

  const result = data.map((d: any) => ({ ...d, mentor: mentorMap.get(d.mentorId) || null }));
  return { data: result, meta: buildPaginationMeta(page, limit, total) };
}

export async function getMyMentorRequests(mentorId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { members,  mentorshipRequests } = getRepos();

  const [data, total] = await Promise.all([
    mentorshipRequests.findMany({ mentorId }, { sort: { createdAt: -1 }, skip, limit }),
    mentorshipRequests.count({ mentorId }),
  ]);

  const menteeIds = [...new Set(data.map((d: any) => d.menteeId).filter(Boolean))];
  const menteeDocs = menteeIds.length > 0
    ? await members.findMany({ _id: { $in: menteeIds } }, { projection: 'fullName photoUrl' })
    : [];
  const menteeMap = new Map(menteeDocs.map((m: any) => [m.id, { id: m.id, fullName: m.fullName, photoUrl: m.photoUrl }]));

  const result = data.map((d: any) => ({ ...d, mentee: menteeMap.get(d.menteeId) || null }));
  return { data: result, meta: buildPaginationMeta(page, limit, total) };
}

export async function respondToRequest(requestId: string, mentorId: string, data: RespondToRequestInput) {
  const { mentorshipRequests } = getRepos();

  const request = await mentorshipRequests.findById(requestId);
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });
  if ((request as any).mentorId !== mentorId) {
    throw Object.assign(new Error('Not authorized to respond to this request'), { statusCode: 403 });
  }
  if ((request as any).status !== 'PENDING') {
    throw Object.assign(new Error('Request has already been responded to'), { statusCode: 400 });
  }

  const result = await mentorshipRequests.updateById(requestId, {
    status: data.status,
    mentorResponse: data.mentorResponse,
  });

  const withRelations = await attachMentorMentee(result);
  return withRelations;
}

// Admin services
export async function adminListMentorshipRequests(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search } = query;
  const { members,  mentorshipRequests } = getRepos();

  let where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();

  // For search on member names, find matching member IDs first
  if (search) {
    const matchingMembers = await members.findMany(
      { fullName: { $regex: search, $options: 'i' } },
      { projection: '_id' },
    );
    const memberIdStrings = matchingMembers.map((m: any) => m.id);
    where.$or = [
      { mentorId: { $in: memberIdStrings } },
      { menteeId: { $in: memberIdStrings } },
    ];
  }

  const [data, total] = await Promise.all([
    mentorshipRequests.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    mentorshipRequests.count(where),
  ]);

  // Attach mentor and mentee info
  const allMemberIds = [...new Set([...data.map((d: any) => d.mentorId), ...data.map((d: any) => d.menteeId)].filter(Boolean))];
  const memberDocs = allMemberIds.length > 0
    ? await members.findMany({ _id: { $in: allMemberIds } }, { projection: 'fullName email photoUrl occupation' })
    : [];
  const memberMap = new Map(memberDocs.map((m: any) => [m.id, { id: m.id, fullName: m.fullName, email: m.email, photoUrl: m.photoUrl, occupation: m.occupation }]));

  const result = data.map((d: any) => ({
    ...d,
    mentor: memberMap.get(d.mentorId) || null,
    mentee: memberMap.get(d.menteeId) || null,
  }));

  return { data: result, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminListMentors(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { members,  mentorshipRequests } = getRepos();

  const where = { isAvailableAsMentor: true, membershipStatus: 'ACTIVE' as const };

  const [data, total] = await Promise.all([
    members.findMany(where, {
      projection: 'fullName email photoUrl occupation organization areaOfExpertise mentorBio yearGroup',
      sort: { fullName: 1 }, skip, limit,
    }),
    members.count(where),
  ]);

  // Attach mentorRequests count
  const memberIds = data.map((m: any) => m.id);
  const requestCounts = await mentorshipRequests.aggregate<{ _id: string; count: number }>([
    { $match: { mentorId: { $in: memberIds } } },
    { $group: { _id: '$mentorId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(requestCounts.map(c => [c._id, c.count]));

  const result = data.map((d: any) => ({
    ...d,
    _count: { mentorRequests: countMap.get(d.id) || 0 },
  }));

  return { data: result, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminDeleteMentorshipRequest(requestId: string) {
  const { mentorshipRequests } = getRepos();

  const request = await mentorshipRequests.findById(requestId);
  if (!request) throw Object.assign(new Error('Request not found'), { statusCode: 404 });
  await mentorshipRequests.deleteById(requestId);
  return { message: 'Mentorship request deleted successfully' };
}
