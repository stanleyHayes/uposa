import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { CreateDueInput, MarkPaidInput, BulkCreateDuesInput, MemberPayDueInput } from './dues.validation';

async function attachMember(doc: Record<string, any>) {
  if (!doc.memberId) return { ...doc, member: null };
  const repos = getRepos();
  const m = await repos.members.findById(doc.memberId, { projection: 'fullName email' });
  return { ...doc, member: m ? { id: (m as any).id, fullName: (m as any).fullName, email: (m as any).email } : null };
}

async function attachMemberMany(docs: Record<string, any>[]) {
  const mIds = [...new Set(docs.map(d => d.memberId).filter(Boolean))];
  if (mIds.length === 0) return docs.map(d => ({ ...d, member: null }));
  const repos = getRepos();
  const mDocs = await repos.members.findMany({ _id: { $in: mIds } }, { projection: 'fullName email' });
  const mMap = new Map(mDocs.map((m: any) => [m.id, { id: m.id, fullName: m.fullName, email: m.email }]));
  return docs.map(d => ({ ...d, member: d.memberId ? mMap.get(d.memberId) || null : null }));
}

export async function getMyDues(memberId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();

  const [data, total] = await Promise.all([
    repos.dues.findMany({ memberId }, { sort: { year: -1 }, skip, limit }),
    repos.dues.count({ memberId }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminListDues(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, year, memberId, search } = query;
  const repos = getRepos();

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (year) where.year = parseInt(year, 10);
  if (memberId) where.memberId = memberId;

  // For search on member name/email, we need to find matching member IDs first
  if (search) {
    const matchingMembers = await repos.members.findMany(
      { $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]},
      { projection: 'id' },
    );
    where.memberId = { $in: matchingMembers.map((m: any) => m.id) };
  }

  const [rawData, total] = await Promise.all([
    repos.dues.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    repos.dues.count(where),
  ]);

  const data = await attachMemberMany(rawData as Record<string, any>[]);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function createDue(data: CreateDueInput) {
  const repos = getRepos();

  const member = await repos.members.findById(data.memberId);
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

  const due = await repos.dues.create({
    memberId: data.memberId,
    amount: data.amount,
    year: data.year,
    status: 'PENDING',
    transactionRef: null,
    paidAt: null,
    notes: data.notes || null,
  });

  return { ...due, member: { id: (member as any).id, fullName: (member as any).fullName, email: (member as any).email } };
}

export async function markDuePaid(id: string, data: MarkPaidInput) {
  const repos = getRepos();

  const due = await repos.dues.findById(id);
  if (!due) throw Object.assign(new Error('Due not found'), { statusCode: 404 });

  const result = await repos.dues.updateById(id, {
    status: 'PAID',
    paidAt: new Date(),
    transactionRef: data.transactionRef || null,
    notes: data.notes || (due as any).notes,
  });

  const withMember = await attachMember(result as Record<string, any>);
  return withMember;
}

export async function memberPayDue(dueId: string, memberId: string, data: MemberPayDueInput) {
  const repos = getRepos();

  const due = await repos.dues.findById(dueId);
  if (!due) throw Object.assign(new Error('Due not found'), { statusCode: 404 });
  if (String((due as any).memberId) !== memberId) {
    throw Object.assign(new Error('Not authorized to pay this due'), { statusCode: 403 });
  }
  if ((due as any).status === 'PAID') {
    throw Object.assign(new Error('This due has already been paid'), { statusCode: 400 });
  }

  const result = await repos.dues.updateById(dueId, {
    status: 'PAID',
    paidAt: new Date(),
    transactionRef: data.transactionRef || null,
    notes: data.notes ? `${(due as any).notes ? (due as any).notes + ' | ' : ''}Payment by member: ${data.notes}` : (due as any).notes,
  });

  return result!;
}

export async function getMemberDueSummary(memberId: string) {
  const repos = getRepos();

  const [totalDues, paidAgg, pendingAgg, overdueAgg] = await Promise.all([
    repos.dues.count({ memberId }),
    repos.dues.aggregate([{ $match: { memberId, status: 'PAID' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    repos.dues.aggregate([{ $match: { memberId, status: 'PENDING' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    repos.dues.aggregate([{ $match: { memberId, status: 'OVERDUE' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  return {
    totalDues,
    totalPaid: paidAgg[0]?.total || 0,
    totalPending: pendingAgg[0]?.total || 0,
    totalOverdue: overdueAgg[0]?.total || 0,
  };
}

export async function bulkCreateDues(data: BulkCreateDuesInput) {
  const repos = getRepos();

  const activeMembers = await repos.members.findMany(
    { membershipStatus: 'ACTIVE', isApproved: true },
    { projection: 'id' },
  );

  if (activeMembers.length === 0) {
    return { created: 0, message: 'No active members found' };
  }

  let created = 0;
  for (const m of activeMembers) {
    const memberId = (m as any).id;
    const existing = await repos.dues.findOne({ memberId, year: data.year });
    if (!existing) {
      await repos.dues.create({
        memberId,
        amount: data.amount,
        year: data.year,
        status: 'PENDING',
        transactionRef: null,
        paidAt: null,
        notes: data.notes || null,
      });
      created++;
    }
  }

  return { created, message: `${created} dues created` };
}
