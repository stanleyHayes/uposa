// @ts-nocheck
import { getRepos, withTransaction } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { CreatePollInput, CastVoteInput } from './polls.validation';
import { emitPollVote } from '../../config/socket';

interface PollOption {
  id: number;
  text: string;
  votes: number;
}

async function attachCreatedBy(doc: Record<string, any>) {
  if (!doc.createdById) return { ...doc, createdBy: null };
  const { admins } = getRepos();
  const a = await admins.findById(doc.createdById, { projection: 'fullName' });
  return { ...doc, createdBy: a ? { id: a.id, fullName: (a as any).fullName } : null };
}

async function attachCreatedByMany(docs: Record<string, any>[]) {
  const ids = [...new Set(docs.map(d => d.createdById).filter(Boolean))];
  if (ids.length === 0) return docs.map(d => ({ ...d, createdBy: null }));
  const { admins } = getRepos();
  const aDocs = await admins.findMany({ _id: { $in: ids } }, { projection: 'fullName' });
  const aMap = new Map(aDocs.map((a: any) => [a.id, { id: a.id, fullName: a.fullName }]));
  return docs.map(d => ({ ...d, createdBy: d.createdById ? aMap.get(d.createdById) || null : null }));
}

export async function listPolls(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { polls, pollVotes } = getRepos();

  const [data, total] = await Promise.all([
    polls.findMany({ status: 'ACTIVE' }, { sort: { createdAt: -1 }, skip, limit }),
    polls.count({ status: 'ACTIVE' }),
  ]);

  const withAdmins = await attachCreatedByMany(data);

  // Attach vote counts
  const pollIds = data.map((p: any) => p.id);
  let countMap = new Map<string, number>();
  if (pollIds.length > 0) {
    try {
      const mongoose = await import('mongoose');
      const objectIds = pollIds.map((id: string) => new mongoose.Types.ObjectId(id));
      const voteCounts = await pollVotes.aggregate<{ _id: string; count: number }>([
        { $match: { pollId: { $in: objectIds } } },
        { $group: { _id: '$pollId', count: { $sum: 1 } } },
      ]);
      countMap = new Map(voteCounts.map(c => [String(c._id), c.count]));
    } catch (err) {
      console.error('Failed to aggregate poll votes:', err);
    }
  }

  const result = withAdmins.map(d => ({
    ...d,
    _count: { votes: countMap.get(d.id) || 0 },
  }));

  return { data: result, meta: buildPaginationMeta(page, limit, total) };
}

export async function getPollById(id: string, memberId: string) {
  const { polls, pollVotes } = getRepos();

  const poll = await polls.findById(id);
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });

  const withAdmin = await attachCreatedBy(poll);
  const [voteCount, userVote] = await Promise.all([
    pollVotes.count({ pollId: id }),
    pollVotes.findOne({ pollId: id, memberId }),
  ]);

  return {
    ...withAdmin,
    _count: { votes: voteCount },
    hasVoted: !!userVote,
    userVote: userVote || null,
  };
}

export async function castVote(pollId: string, memberId: string, data: CastVoteInput) {
  const { polls, pollVotes } = getRepos();

  const poll = await polls.findById(pollId);
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });
  if ((poll as any).status !== 'ACTIVE') {
    throw Object.assign(new Error('This poll is closed'), { statusCode: 400 });
  }
  if ((poll as any).endsAt && new Date() > (poll as any).endsAt) {
    throw Object.assign(new Error('This poll has ended'), { statusCode: 400 });
  }

  const existingVote = await pollVotes.findOne({ pollId, memberId });
  if (existingVote) {
    throw Object.assign(new Error('You have already voted on this poll'), { statusCode: 409 });
  }

  if (!(poll as any).allowMultiple && data.selectedOptions.length > 1) {
    throw Object.assign(new Error('This poll does not allow multiple selections'), { statusCode: 400 });
  }

  // Update vote counts in options JSON
  const options = (poll as any).options as PollOption[];
  const updatedOptions = options.map((opt) => {
    if (data.selectedOptions.includes(opt.id)) {
      return { ...opt, votes: opt.votes + 1 };
    }
    return opt;
  });

  // Use withTransaction for transactional behavior
  await withTransaction(async () => {
    await pollVotes.create({
      pollId, memberId, selectedOptions: data.selectedOptions, createdAt: new Date(),
    });
    await polls.updateById(pollId, { $set: { options: updatedOptions } });
  });

  // Emit real-time update
  const totalVotes = updatedOptions.reduce((sum: number, o: any) => sum + o.votes, 0);
  emitPollVote(pollId, { pollId, options: updatedOptions, totalVotes });

  return { message: 'Vote cast successfully' };
}

export async function createPoll(adminId: string, data: CreatePollInput) {
  const { polls } = getRepos();
  const optionsWithVotes = data.options.map((opt) => ({ ...opt, votes: 0 }));

  const poll = await polls.create({
    question: data.question,
    description: data.description || null,
    options: optionsWithVotes,
    allowMultiple: data.allowMultiple || false,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
    createdById: adminId,
    status: 'ACTIVE',
  });

  const withAdmin = await attachCreatedBy(poll);
  return withAdmin;
}

export async function closePoll(id: string) {
  const { polls } = getRepos();

  const poll = await polls.findById(id);
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });

  const result = await polls.updateById(id, { status: 'CLOSED' });
  const withAdmin = await attachCreatedBy(result);
  return withAdmin;
}

export async function adminListAllPolls(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status } = query;
  const { polls, pollVotes } = getRepos();

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();

  const [data, total] = await Promise.all([
    polls.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    polls.count(where),
  ]);

  const withAdmins = await attachCreatedByMany(data);

  const pollIds = data.map((p: any) => p.id);
  let countMap = new Map<string, number>();
  if (pollIds.length > 0) {
    try {
      const mongoose = await import('mongoose');
      const objectIds = pollIds.map((id: string) => new mongoose.Types.ObjectId(id));
      const voteCounts = await pollVotes.aggregate<{ _id: string; count: number }>([
        { $match: { pollId: { $in: objectIds } } },
        { $group: { _id: '$pollId', count: { $sum: 1 } } },
      ]);
      countMap = new Map(voteCounts.map(c => [String(c._id), c.count]));
    } catch (err) {
      console.error('Failed to aggregate poll votes:', err);
    }
  }

  const result = withAdmins.map(d => ({
    ...d,
    _count: { votes: countMap.get(d.id) || 0 },
  }));

  return { data: result, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminUpdatePoll(id: string, data: { question?: string; description?: string; endsAt?: string }) {
  const { polls, pollVotes } = getRepos();

  const poll = await polls.findById(id);
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });

  const updateData: Record<string, unknown> = {};
  if (data.question) updateData.question = data.question;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.endsAt) updateData.endsAt = new Date(data.endsAt);

  const result = await polls.updateById(id, updateData);
  const withAdmin = await attachCreatedBy(result);
  const voteCount = await pollVotes.count({ pollId: id });
  return { ...withAdmin, _count: { votes: voteCount } };
}

export async function adminDeletePoll(id: string) {
  const { polls } = getRepos();

  const poll = await polls.findById(id);
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });
  await polls.deleteById(id);
  return { message: 'Poll deleted successfully' };
}

export async function adminGetPollResults(id: string) {
  const { polls, pollVotes,  members } = getRepos();

  const poll = await polls.findById(id);
  if (!poll) throw Object.assign(new Error('Poll not found'), { statusCode: 404 });

  const withAdmin = await attachCreatedBy(poll);
  const votes = await pollVotes.findMany({ pollId: id });

  // Attach member info to votes
  const memberIds = [...new Set(votes.map((v: any) => v.memberId).filter(Boolean))];
  const memberDocs = memberIds.length > 0
    ? await members.findMany({ _id: { $in: memberIds } }, { projection: 'fullName' })
    : [];
  const memberMap = new Map(memberDocs.map((m: any) => [m.id, { id: m.id, fullName: m.fullName }]));

  const votesWithMembers = votes.map((v: any) => ({
    ...v,
    member: memberMap.get(v.memberId) || null,
  }));

  return {
    ...withAdmin,
    votes: votesWithMembers,
    _count: { votes: votes.length },
  };
}
