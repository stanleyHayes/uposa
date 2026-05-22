import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { CreateJobInput, UpdateJobInput, ApplyToJobInput, UpdateApplicationStatusInput } from './jobs.validation';

async function attachPostedBy(doc: Record<string, any>) {
  if (!doc.postedById) return { ...doc, postedBy: null };
  const repos = getRepos();
  const m = await repos.members.findById(doc.postedById, { projection: 'fullName email' });
  return { ...doc, postedBy: m ? { id: (m as any).id, fullName: (m as any).fullName, email: (m as any).email } : null };
}

async function attachPostedByMany(docs: Record<string, any>[]) {
  const ids = [...new Set(docs.map(d => d.postedById).filter(Boolean))];
  if (ids.length === 0) return docs.map(d => ({ ...d, postedBy: null }));
  const repos = getRepos();
  const mDocs = await repos.members.findMany({ _id: { $in: ids } }, { projection: 'fullName email' });
  const mMap = new Map(mDocs.map((m: any) => [m.id, { id: m.id, fullName: m.fullName, email: m.email }]));
  return docs.map(d => ({ ...d, postedBy: d.postedById ? mMap.get(d.postedById) || null : null }));
}

async function attachAppCount(docs: Record<string, any>[]) {
  const repos = getRepos();
  const jobIds = docs.map(d => d.id);
  const counts = await repos.jobApplications.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: '$jobId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c: any) => [c._id, c.count]));
  return docs.map(d => ({ ...d, _count: { applications: countMap.get(d.id) || 0 } }));
}

export async function listJobs(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { jobType, search } = query;
  const repos = getRepos();
  const now = new Date();

  const where: Record<string, unknown> = {
    isApproved: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
  };
  if (jobType) where.jobType = jobType.toUpperCase();
  if (search) {
    where.$and = [{
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ],
    }];
  }

  const [rawData, total] = await Promise.all([
    repos.jobs.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    repos.jobs.count(where),
  ]);

  const withPosted = await attachPostedByMany(rawData as Record<string, any>[]);
  const withCounts = await attachAppCount(withPosted);
  return { data: withCounts, meta: buildPaginationMeta(page, limit, total) };
}

export async function getJobById(id: string) {
  const repos = getRepos();

  const job = await repos.jobs.findOne({ _id: id, isApproved: true } as any);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

  const appCount = await repos.jobApplications.count({ jobId: id });
  const withPosted = await attachPostedBy(job as Record<string, any>);
  return { ...withPosted, _count: { applications: appCount } };
}

export async function postJob(memberId: string, data: CreateJobInput) {
  const repos = getRepos();

  const job = await repos.jobs.create({
    title: data.title,
    description: data.description,
    company: data.company,
    location: data.location || null,
    jobType: data.jobType || 'FULL_TIME',
    contactEmail: data.contactEmail || null,
    externalUrl: data.externalUrl || null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    postedById: memberId,
    isApproved: false,
  });

  return job;
}

export async function getMyPostings(memberId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();

  const [rawData, total] = await Promise.all([
    repos.jobs.findMany({ postedById: memberId }, { sort: { createdAt: -1 }, skip, limit }),
    repos.jobs.count({ postedById: memberId }),
  ]);

  const withCounts = await attachAppCount(rawData as Record<string, any>[]);
  return { data: withCounts, meta: buildPaginationMeta(page, limit, total) };
}

export async function updateMyJob(jobId: string, memberId: string, data: UpdateJobInput) {
  const repos = getRepos();

  const job = await repos.jobs.findById(jobId);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  if (String((job as any).postedById) !== memberId) {
    throw Object.assign(new Error('Not authorized to edit this job'), { statusCode: 403 });
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);

  const result = await repos.jobs.updateById(jobId, updateData);
  return result!;
}

export async function deleteMyJob(jobId: string, memberId: string) {
  const repos = getRepos();

  const job = await repos.jobs.findById(jobId);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  if (String((job as any).postedById) !== memberId) {
    throw Object.assign(new Error('Not authorized to delete this job'), { statusCode: 403 });
  }
  await repos.jobs.deleteById(jobId);
  return { message: 'Job deleted successfully' };
}

// Job Applications
export async function applyToJob(jobId: string, applicantId: string, data: ApplyToJobInput) {
  const repos = getRepos();

  const job = await repos.jobs.findById(jobId);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  if (!(job as any).isApproved) throw Object.assign(new Error('Job is not yet approved'), { statusCode: 400 });
  if (String((job as any).postedById) === applicantId) {
    throw Object.assign(new Error('You cannot apply to your own job posting'), { statusCode: 400 });
  }
  if ((job as any).expiresAt && (job as any).expiresAt < new Date()) {
    throw Object.assign(new Error('This job posting has expired'), { statusCode: 400 });
  }

  const application = await repos.jobApplications.create({
    jobId,
    applicantId,
    coverLetter: data.coverLetter || null,
    resumeUrl: data.resumeUrl || null,
    status: 'PENDING',
    notes: null,
  });

  return {
    ...application,
    job: { id: (job as any).id, title: (job as any).title, company: (job as any).company },
  };
}

export async function getMyApplications(applicantId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();

  const pipeline = [
    { $match: { applicantId } },
    { $sort: { createdAt: -1 as const } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'jobs',
        let: { jid: '$jobId' },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$jid'] } } },
          { $project: { _id: 0, id: { $toString: '$_id' }, title: 1, company: 1, location: 1, jobType: 1 } },
        ],
        as: '_job',
      },
    },
    { $addFields: { job: { $arrayElemAt: ['$_job', 0] }, id: { $toString: '$_id' } } },
    { $project: { _job: 0 } },
  ];

  const [data, total] = await Promise.all([
    repos.jobApplications.aggregate(pipeline),
    repos.jobApplications.count({ applicantId }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getJobApplications(jobId: string, memberId: string, query: Record<string, string | undefined>) {
  const repos = getRepos();

  const job = await repos.jobs.findById(jobId);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  if (String((job as any).postedById) !== memberId) {
    throw Object.assign(new Error('Not authorized to view applications for this job'), { statusCode: 403 });
  }

  const { page, limit, skip } = getPaginationParams(query);

  const pipeline = [
    { $match: { jobId } },
    { $sort: { createdAt: -1 as const } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'members',
        let: { aid: '$applicantId' },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$aid'] } } },
          { $project: { _id: 0, id: { $toString: '$_id' }, fullName: 1, email: 1, photoUrl: 1, occupation: 1, areaOfExpertise: 1 } },
        ],
        as: '_applicant',
      },
    },
    { $addFields: { applicant: { $arrayElemAt: ['$_applicant', 0] }, id: { $toString: '$_id' } } },
    { $project: { _applicant: 0 } },
  ];

  const [data, total] = await Promise.all([
    repos.jobApplications.aggregate(pipeline),
    repos.jobApplications.count({ jobId }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function updateApplicationStatus(applicationId: string, memberId: string, data: UpdateApplicationStatusInput) {
  const repos = getRepos();

  const application = await repos.jobApplications.findById(applicationId);
  if (!application) throw Object.assign(new Error('Application not found'), { statusCode: 404 });

  const job = await repos.jobs.findById((application as any).jobId);
  if (!job || String((job as any).postedById) !== memberId) {
    throw Object.assign(new Error('Not authorized to update this application'), { statusCode: 403 });
  }

  const result = await repos.jobApplications.updateById(applicationId, {
    status: data.status,
    notes: data.notes,
  });

  const applicant = await repos.members.findById((result as any).applicantId, { projection: 'fullName email' });
  return {
    ...result,
    applicant: applicant ? { id: (applicant as any).id, fullName: (applicant as any).fullName, email: (applicant as any).email } : null,
    job: { id: (job as any).id, title: (job as any).title },
  };
}

// Admin services
export async function adminListAllJobs(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search } = query;
  const repos = getRepos();

  const where: Record<string, unknown> = {};
  if (status === 'pending') where.isApproved = false;
  else if (status === 'approved') where.isApproved = true;
  if (search) {
    where.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const [rawData, total] = await Promise.all([
    repos.jobs.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    repos.jobs.count(where),
  ]);

  const withPosted = await attachPostedByMany(rawData as Record<string, any>[]);
  const withCounts = await attachAppCount(withPosted);
  return { data: withCounts, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminListPendingJobs(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();

  const [rawData, total] = await Promise.all([
    repos.jobs.findMany({ isApproved: false }, { sort: { createdAt: -1 }, skip, limit }),
    repos.jobs.count({ isApproved: false }),
  ]);

  const withPosted = await attachPostedByMany(rawData as Record<string, any>[]);
  return { data: withPosted, meta: buildPaginationMeta(page, limit, total) };
}

export async function approveJob(id: string) {
  const repos = getRepos();

  const job = await repos.jobs.findById(id);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

  const result = await repos.jobs.updateById(id, { isApproved: true });
  const withPosted = await attachPostedBy(result as Record<string, any>);
  return withPosted;
}

export async function deleteJob(id: string) {
  const repos = getRepos();

  const job = await repos.jobs.findById(id);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  await repos.jobs.deleteById(id);
  return { message: 'Job removed successfully' };
}

export async function adminGetJobApplications(jobId: string, query: Record<string, string | undefined>) {
  const repos = getRepos();

  const job = await repos.jobs.findById(jobId);
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

  const { page, limit, skip } = getPaginationParams(query);

  const pipeline = [
    { $match: { jobId } },
    { $sort: { createdAt: -1 as const } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'members',
        let: { aid: '$applicantId' },
        pipeline: [
          { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$aid'] } } },
          { $project: { _id: 0, id: { $toString: '$_id' }, fullName: 1, email: 1, photoUrl: 1, occupation: 1 } },
        ],
        as: '_applicant',
      },
    },
    { $addFields: { applicant: { $arrayElemAt: ['$_applicant', 0] }, id: { $toString: '$_id' } } },
    { $project: { _applicant: 0 } },
  ];

  const [data, total] = await Promise.all([
    repos.jobApplications.aggregate(pipeline),
    repos.jobApplications.count({ jobId }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminUpdateApplicationStatus(applicationId: string, data: UpdateApplicationStatusInput) {
  const repos = getRepos();

  const application = await repos.jobApplications.findById(applicationId);
  if (!application) throw Object.assign(new Error('Application not found'), { statusCode: 404 });

  const result = await repos.jobApplications.updateById(applicationId, {
    status: data.status,
    notes: data.notes,
  });

  const [applicant, job] = await Promise.all([
    repos.members.findById((result as any).applicantId, { projection: 'fullName email' }),
    repos.jobs.findById((result as any).jobId, { projection: 'title' }),
  ]);

  return {
    ...result,
    applicant: applicant ? { id: (applicant as any).id, fullName: (applicant as any).fullName, email: (applicant as any).email } : null,
    job: job ? { id: (job as any).id, title: (job as any).title } : null,
  };
}
