// @ts-nocheck
import { getRepos, withTransaction } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { CreateElectionInput, ChangeElectionStatusInput, CastElectionVoteInput } from './elections.validation';
import { emitElectionVote, emitElectionStatus } from '../../config/socket';

interface ElectionCandidate {
  id: string;
  name: string;
  memberId?: string;
  bio?: string;
  photoUrl?: string;
  votes: number;
}

async function attachCreatedBy(doc: Record<string, any>) {
  if (!doc.createdById) return { ...doc, createdBy: null };
  const { admins } = getRepos();
  const a = await admins.findById(doc.createdById, { projection: { id: 1, fullName: 1 } });
  return { ...doc, createdBy: a ? { id: a.id, fullName: a.fullName } : null };
}

async function attachCreatedByMany(docs: Record<string, any>[]) {
  const ids = [...new Set(docs.map(d => d.createdById).filter(Boolean))];
  if (ids.length === 0) return docs.map(d => ({ ...d, createdBy: null }));
  const { admins } = getRepos();
  const aDocs = await admins.findMany({ _id: { $in: ids } }, { projection: { id: 1, fullName: 1 } });
  const aMap = new Map(aDocs.map(a => [a.id, { id: a.id, fullName: a.fullName }]));
  return docs.map(d => ({ ...d, createdBy: d.createdById ? aMap.get(d.createdById) || null : null }));
}

export async function listElections(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status } = query;
  const { elections } = getRepos();

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();

  const [rawData, total] = await Promise.all([
    elections.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    elections.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getElectionById(id: string, memberId: string) {
  const { elections, electionVotes } = getRepos();

  const election = await elections.findById(id);
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });

  const withAdmin = await attachCreatedBy(election);
  const voteCount = await electionVotes.count({ electionId: id });
  const userVote = await electionVotes.findOne({ electionId: id, voterId: memberId });

  // Hide vote counts unless election is completed
  let candidates = election.candidates as ElectionCandidate[];
  if (election.status !== 'COMPLETED') {
    candidates = candidates.map(({ votes: _v, ...rest }) => ({ ...rest, votes: 0 }));
  }

  return {
    ...withAdmin,
    candidates,
    _count: { votes: voteCount },
    hasVoted: !!userVote,
  };
}

export async function castVote(electionId: string, voterId: string, data: CastElectionVoteInput) {
  const { elections, electionVotes } = getRepos();

  const election = await elections.findById(electionId);
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });
  if (election.status !== 'ACTIVE') {
    throw Object.assign(new Error('This election is not currently active'), { statusCode: 400 });
  }

  const now = new Date();
  if (now < election.startDate || now > election.endDate) {
    throw Object.assign(new Error('Voting is not within the allowed time period'), { statusCode: 400 });
  }

  const existingVote = await electionVotes.findOne({ electionId, voterId });
  if (existingVote) {
    throw Object.assign(new Error('You have already voted in this election'), { statusCode: 409 });
  }

  const candidates = election.candidates as ElectionCandidate[];
  const candidateExists = candidates.some((c) => c.id === data.candidateId);
  if (!candidateExists) {
    throw Object.assign(new Error('Candidate not found'), { statusCode: 404 });
  }

  const updatedCandidates = candidates.map((c) =>
    c.id === data.candidateId ? { ...c, votes: c.votes + 1 } : c
  );

  await withTransaction(async (session) => {
    await electionVotes.create({ electionId, candidateId: data.candidateId, voterId }, { session });
    await elections.updateById(electionId, { candidates: updatedCandidates }, { session });
  });

  // Emit real-time update
  const totalVotes = updatedCandidates.reduce((sum: number, c: any) => sum + c.votes, 0);
  emitElectionVote(electionId, { electionId, candidateId: data.candidateId, totalVotes });

  return { message: 'Vote cast successfully' };
}

export async function createElection(adminId: string, data: CreateElectionInput) {
  const { elections } = getRepos();

  const candidatesWithVotes = data.candidates.map((c) => ({ ...c, votes: 0 }));

  const doc = await elections.create({
    title: data.title,
    description: data.description || null,
    position: data.position,
    candidates: candidatesWithVotes,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    createdById: adminId,
    status: 'UPCOMING',
  });

  const withAdmin = await attachCreatedBy(doc);
  return withAdmin;
}

export async function changeElectionStatus(id: string, data: ChangeElectionStatusInput) {
  const { elections } = getRepos();

  const election = await elections.findById(id);
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });

  const updated = await elections.updateById(id, { status: data.status });
  const withAdmin = await attachCreatedBy(updated!);
  return withAdmin;
}

export async function getElectionResults(id: string) {
  const { elections, electionVotes, members } = getRepos();

  const election = await elections.findById(id);
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });

  const rawVotes = await electionVotes.findMany({ electionId: id });

  // Attach voter info
  const voterIds = [...new Set(rawVotes.map(v => v.voterId).filter(Boolean))];
  const voterDocs = voterIds.length > 0
    ? await members.findMany({ _id: { $in: voterIds } }, { projection: { id: 1, fullName: 1 } })
    : [];
  const voterMap = new Map(voterDocs.map(v => [v.id, { id: v.id, fullName: v.fullName }]));

  const votes = rawVotes.map(v => ({ ...v, voter: voterMap.get(v.voterId) || null }));
  const withAdmin = await attachCreatedBy(election);

  const totalVotes = votes.length;
  const candidates = (election.candidates as ElectionCandidate[]).map((c) => ({
    ...c,
    percentage: totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(2) : '0.00',
  }));

  return {
    ...withAdmin,
    candidates,
    votes,
    totalVotes,
  };
}

export async function adminListAllElections(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status } = query;
  const { elections, electionVotes } = getRepos();

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();

  const [rawData, total] = await Promise.all([
    elections.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    elections.count(where),
  ]);

  const withAdmins = await attachCreatedByMany(rawData);

  const electionIds = rawData.map(e => e.id);
  let countMap = new Map<string, number>();
  if (electionIds.length > 0) {
    try {
      const mongoose = await import('mongoose');
      const objectIds = electionIds.map((id: string) => new mongoose.Types.ObjectId(id));
      const voteCounts = await electionVotes.aggregate<{ _id: string; count: number }>([
        { $match: { electionId: { $in: objectIds } } },
        { $group: { _id: '$electionId', count: { $sum: 1 } } },
      ]);
      countMap = new Map(voteCounts.map(c => [String(c._id), c.count]));
    } catch (err) {
      console.error('Failed to aggregate election votes:', err);
    }
  }

  const data = withAdmins.map(d => ({
    ...d,
    _count: { votes: countMap.get(d.id) || 0 },
  }));

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminDeleteElection(id: string) {
  const { elections } = getRepos();

  const election = await elections.findById(id);
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });
  await elections.deleteById(id);
  return { message: 'Election deleted successfully' };
}

export async function adminUpdateElection(id: string, data: { title?: string; description?: string; startDate?: string; endDate?: string }) {
  const { elections, electionVotes } = getRepos();

  const election = await elections.findById(id);
  if (!election) throw Object.assign(new Error('Election not found'), { statusCode: 404 });

  const updateData: Record<string, unknown> = {};
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  const updated = await elections.updateById(id, updateData);
  const withAdmin = await attachCreatedBy(updated!);
  const voteCount = await electionVotes.count({ electionId: id });
  return { ...withAdmin, _count: { votes: voteCount } };
}
