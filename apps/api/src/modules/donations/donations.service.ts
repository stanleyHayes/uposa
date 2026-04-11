// @ts-nocheck
import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { notify } from '../../utils/notify';
import { CreateDonationInput, ConfirmDonationInput } from './donations.validation';

export async function submitDonation(data: CreateDonationInput, memberId?: string) {
  const repos = getRepos();

  const donation = await repos.donations.create({
    memberId: memberId || null,
    donorName: data.donorName,
    donorEmail: data.donorEmail,
    amount: data.amount,
    currency: data.currency || 'GHS',
    channel: data.channel || 'CASH',
    purpose: data.purpose || null,
    transactionRef: data.transactionRef || null,
    projectId: data.projectId || null,
    notes: data.notes || null,
    status: 'PENDING',
  });

  notify('NEW_DONATION', 'New Donation', `${data.donorName} donated ${data.currency || 'GHS'} ${data.amount}.`, '/donations');

  // Attach project info
  if (donation.projectId) {
    const project = await repos.projects.findById(donation.projectId, { projection: 'title' });
    return { ...donation, project: project ? { id: project.id, title: project.title } : null };
  }
  return { ...donation, project: null };
}

export async function getMyDonations(memberId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();

  const pipeline = [
    { $match: { memberId } },
    { $sort: { createdAt: -1 as const } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'projects',
        let: { pid: '$projectId' },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$pid'] } } },
          { $project: { _id: 0, id: { $toString: '$_id' }, title: 1 } },
        ],
        as: '_project',
      },
    },
    { $addFields: { project: { $ifNull: [{ $arrayElemAt: ['$_project', 0] }, null] } } },
    { $project: { _project: 0 } },
  ];

  const [data, total] = await Promise.all([
    repos.donations.aggregate(pipeline),
    repos.donations.count({ memberId }),
  ]);

  // Normalize _id → id for aggregation results (plain objects)
  const normalized = data.map((d: any) => {
    const { _id, ...rest } = d;
    return { id: _id.toString(), ...rest };
  });

  return { data: normalized, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminListDonations(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, channel, projectId, search } = query;
  const repos = getRepos();

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (channel) where.channel = channel.toUpperCase();
  if (projectId) where.projectId = projectId;
  if (search) {
    where.$or = [
      { donorName: { $regex: search, $options: 'i' } },
      { donorEmail: { $regex: search, $options: 'i' } },
      { transactionRef: { $regex: search, $options: 'i' } },
    ];
  }

  const [rawData, total] = await Promise.all([
    repos.donations.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    repos.donations.count(where),
  ]);

  // Attach member and project info
  const memberIds = [...new Set(rawData.map(d => (d as any).memberId).filter(Boolean))];
  const projectIds = [...new Set(rawData.map(d => (d as any).projectId).filter(Boolean))];

  const [memberDocs, projectDocs] = await Promise.all([
    memberIds.length > 0 ? repos.members.findMany({ _id: { $in: memberIds } }, { projection: 'fullName email' }) : [],
    projectIds.length > 0 ? repos.projects.findMany({ _id: { $in: projectIds } }, { projection: 'title' }) : [],
  ]);

  const memberMap = new Map(memberDocs.map((m: any) => [m.id, { id: m.id, fullName: m.fullName, email: m.email }]));
  const projectMap = new Map(projectDocs.map((p: any) => [p.id, { id: p.id, title: p.title }]));

  const data = rawData.map((d: any) => ({
    ...d,
    member: d.memberId ? memberMap.get(d.memberId) || null : null,
    project: d.projectId ? projectMap.get(d.projectId) || null : null,
  }));

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getDonationById(id: string) {
  const repos = getRepos();
  const donation = await repos.donations.findById(id);
  if (!donation) throw Object.assign(new Error('Donation not found'), { statusCode: 404 });

  // Attach member info if linked
  let member = null;
  if ((donation as any).memberId) {
    const m = await repos.members.findById((donation as any).memberId, { projection: 'fullName email' });
    if (m) member = { id: m.id, fullName: (m as any).fullName, email: (m as any).email };
  }

  return { ...donation, member };
}

export async function confirmDonation(id: string, data: ConfirmDonationInput) {
  const repos = getRepos();

  const donation = await repos.donations.findById(id);
  if (!donation) throw Object.assign(new Error('Donation not found'), { statusCode: 404 });

  const result = await repos.donations.updateById(id, {
    status: 'CONFIRMED',
    transactionRef: data.transactionRef || (donation as any).transactionRef,
    notes: data.notes || (donation as any).notes,
  });

  if ((donation as any).projectId) {
    await repos.projects.incrementById((donation as any).projectId, 'raisedAmount', (donation as any).amount);
  }

  return result!;
}

export async function getDonationSummary() {
  const repos = getRepos();

  const [totalAgg, byChannel, byStatus] = await Promise.all([
    repos.donations.aggregate([
      { $match: { status: 'CONFIRMED' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    repos.donations.aggregate([
      { $match: { status: 'CONFIRMED' } },
      { $group: { _id: '$channel', _sum: { $sum: '$amount' }, _count: { $sum: 1 } } },
    ]),
    repos.donations.aggregate([
      { $group: { _id: '$status', _sum: { $sum: '$amount' }, _count: { $sum: 1 } } },
    ]),
  ]);

  return {
    totalConfirmed: totalAgg[0]?.total || 0,
    totalConfirmedCount: totalAgg[0]?.count || 0,
    byChannel: byChannel.map((c: any) => ({ channel: c._id, _sum: { amount: c._sum }, _count: c._count })),
    byStatus: byStatus.map((s: any) => ({ status: s._id, _sum: { amount: s._sum }, _count: s._count })),
  };
}
