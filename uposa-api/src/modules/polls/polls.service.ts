import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { CreatePollInput, CastVoteInput } from './polls.validation';

interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export async function listPolls(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.poll.findMany({
      where: { status: 'ACTIVE' },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        _count: { select: { votes: true } },
      },
    }),
    prisma.poll.count({ where: { status: 'ACTIVE' } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getPollById(id: string, memberId: string) {
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      _count: { select: { votes: true } },
    },
  });
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });

  const userVote = await prisma.pollVote.findUnique({
    where: { pollId_memberId: { pollId: id, memberId } },
  });

  return { ...poll, hasVoted: !!userVote, userVote };
}

export async function castVote(pollId: string, memberId: string, data: CastVoteInput) {
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });
  if (poll.status !== 'ACTIVE') {
    throw Object.assign(new Error('This poll is closed'), { statusCode: 400 });
  }
  if (poll.endsAt && new Date() > poll.endsAt) {
    throw Object.assign(new Error('This poll has ended'), { statusCode: 400 });
  }

  const existingVote = await prisma.pollVote.findUnique({
    where: { pollId_memberId: { pollId, memberId } },
  });
  if (existingVote) {
    throw Object.assign(new Error('You have already voted on this poll'), { statusCode: 409 });
  }

  if (!poll.allowMultiple && data.selectedOptions.length > 1) {
    throw Object.assign(new Error('This poll does not allow multiple selections'), { statusCode: 400 });
  }

  // Update vote counts in options JSON
  const options = (poll.options as unknown) as PollOption[];
  const updatedOptions = options.map((opt) => {
    if (data.selectedOptions.includes(opt.id)) {
      return { ...opt, votes: opt.votes + 1 };
    }
    return opt;
  });

  await prisma.$transaction([
    prisma.pollVote.create({
      data: { pollId, memberId, selectedOptions: data.selectedOptions },
    }),
    prisma.poll.update({
      where: { id: pollId },
      data: { options: updatedOptions as unknown as import('@prisma/client').Prisma.InputJsonValue },
    }),
  ]);

  return { message: 'Vote cast successfully' };
}

export async function createPoll(adminId: string, data: CreatePollInput) {
  const optionsWithVotes = data.options.map((opt) => ({ ...opt, votes: 0 }));

  return prisma.poll.create({
    data: {
      question: data.question,
      description: data.description,
      options: optionsWithVotes as unknown as import('@prisma/client').Prisma.InputJsonValue,
      allowMultiple: data.allowMultiple || false,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      createdById: adminId,
      status: 'ACTIVE',
    },
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
}

export async function closePoll(id: string) {
  const poll = await prisma.poll.findUnique({ where: { id } });
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });

  return prisma.poll.update({
    where: { id },
    data: { status: 'CLOSED' },
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
}

export async function adminListAllPolls(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status } = query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();

  const [data, total] = await Promise.all([
    prisma.poll.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        _count: { select: { votes: true } },
      },
    }),
    prisma.poll.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminUpdatePoll(id: string, data: { question?: string; description?: string; endsAt?: string }) {
  const poll = await prisma.poll.findUnique({ where: { id } });
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });

  const updateData: Record<string, unknown> = {};
  if (data.question) updateData.question = data.question;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.endsAt) updateData.endsAt = new Date(data.endsAt);

  return prisma.poll.update({
    where: { id },
    data: updateData,
    include: { createdBy: { select: { id: true, fullName: true } }, _count: { select: { votes: true } } },
  });
}

export async function adminDeletePoll(id: string) {
  const poll = await prisma.poll.findUnique({ where: { id } });
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });
  await prisma.poll.delete({ where: { id } });
  return { message: 'Poll deleted successfully' };
}

export async function adminGetPollResults(id: string) {
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      votes: {
        include: { member: { select: { id: true, fullName: true } } },
      },
      _count: { select: { votes: true } },
    },
  });
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });
  return poll;
}
