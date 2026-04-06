import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { CreateElectionInput, ChangeElectionStatusInput, CastElectionVoteInput } from './elections.validation';

interface ElectionCandidate {
  id: string;
  name: string;
  memberId?: string;
  bio?: string;
  photoUrl?: string;
  votes: number;
}

export async function listElections(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status } = query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();

  const [data, total] = await Promise.all([
    prisma.election.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    }),
    prisma.election.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getElectionById(id: string, memberId: string) {
  const election = await prisma.election.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      _count: { select: { votes: true } },
    },
  });
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });

  const userVote = await prisma.electionVote.findUnique({
    where: { electionId_voterId: { electionId: id, voterId: memberId } },
  });

  // Hide vote counts unless election is completed
  let candidates = (election.candidates as unknown) as ElectionCandidate[];
  if (election.status !== 'COMPLETED') {
    candidates = candidates.map(({ votes: _v, ...rest }) => ({ ...rest, votes: 0 }));
  }

  return { ...election, candidates, hasVoted: !!userVote };
}

export async function castVote(electionId: string, voterId: string, data: CastElectionVoteInput) {
  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });
  if (election.status !== 'ACTIVE') {
    throw Object.assign(new Error('This election is not currently active'), { statusCode: 400 });
  }

  const now = new Date();
  if (now < election.startDate || now > election.endDate) {
    throw Object.assign(new Error('Voting is not within the allowed time period'), { statusCode: 400 });
  }

  const existingVote = await prisma.electionVote.findUnique({
    where: { electionId_voterId: { electionId, voterId } },
  });
  if (existingVote) {
    throw Object.assign(new Error('You have already voted in this election'), { statusCode: 409 });
  }

  // Validate candidate exists
  const candidates = (election.candidates as unknown) as ElectionCandidate[];
  const candidateExists = candidates.some((c) => c.id === data.candidateId);
  if (!candidateExists) {
    throw Object.assign(new Error('Candidate not found'), { statusCode: 404 });
  }

  // Update vote count
  const updatedCandidates = candidates.map((c) =>
    c.id === data.candidateId ? { ...c, votes: c.votes + 1 } : c
  );

  await prisma.$transaction([
    prisma.electionVote.create({
      data: { electionId, candidateId: data.candidateId, voterId },
    }),
    prisma.election.update({
      where: { id: electionId },
      data: { candidates: updatedCandidates as unknown as import('@prisma/client').Prisma.InputJsonValue },
    }),
  ]);

  return { message: 'Vote cast successfully' };
}

export async function createElection(adminId: string, data: CreateElectionInput) {
  const candidatesWithVotes = data.candidates.map((c) => ({ ...c, votes: 0 }));

  return prisma.election.create({
    data: {
      title: data.title,
      description: data.description,
      position: data.position,
      candidates: candidatesWithVotes as unknown as import('@prisma/client').Prisma.InputJsonValue,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdById: adminId,
      status: 'UPCOMING',
    },
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
}

export async function changeElectionStatus(id: string, data: ChangeElectionStatusInput) {
  const election = await prisma.election.findUnique({ where: { id } });
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });

  return prisma.election.update({
    where: { id },
    data: { status: data.status },
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
}

export async function getElectionResults(id: string) {
  const election = await prisma.election.findUnique({
    where: { id },
    include: {
      votes: {
        include: { voter: { select: { id: true, fullName: true } } },
      },
      createdBy: { select: { id: true, fullName: true } },
    },
  });
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });

  const totalVotes = election.votes.length;
  const candidates = (election.candidates as unknown) as ElectionCandidate[];
  const resultsWithPercentage = candidates.map((c) => ({
    ...c,
    percentage: totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(2) : '0.00',
  }));

  return {
    ...election,
    candidates: resultsWithPercentage,
    totalVotes,
  };
}

export async function adminListAllElections(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status } = query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();

  const [data, total] = await Promise.all([
    prisma.election.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        _count: { select: { votes: true } },
      },
    }),
    prisma.election.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminDeleteElection(id: string) {
  const election = await prisma.election.findUnique({ where: { id } });
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });
  await prisma.election.delete({ where: { id } });
  return { message: 'Election deleted successfully' };
}

export async function adminUpdateElection(id: string, data: { title?: string; description?: string; startDate?: string; endDate?: string }) {
  const election = await prisma.election.findUnique({ where: { id } });
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });

  const updateData: Record<string, unknown> = {};
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  return prisma.election.update({
    where: { id },
    data: updateData,
    include: { createdBy: { select: { id: true, fullName: true } }, _count: { select: { votes: true } } },
  });
}
