import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { CreateJobInput, UpdateJobInput, ApplyToJobInput, UpdateApplicationStatusInput } from './jobs.validation';

export async function listJobs(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { jobType, search } = query;
  const now = new Date();

  const where: Record<string, unknown> = {
    isApproved: true,
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
  };
  if (jobType) where.jobType = jobType.toUpperCase();
  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        postedBy: { select: { id: true, fullName: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getJobById(id: string) {
  const job = await prisma.job.findUnique({
    where: { id, isApproved: true },
    include: {
      postedBy: { select: { id: true, fullName: true } },
      _count: { select: { applications: true } },
    },
  });
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  return job;
}

export async function postJob(memberId: string, data: CreateJobInput) {
  return prisma.job.create({
    data: {
      title: data.title,
      description: data.description,
      company: data.company,
      location: data.location,
      jobType: data.jobType || 'FULL_TIME',
      contactEmail: data.contactEmail,
      externalUrl: data.externalUrl || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      postedById: memberId,
      isApproved: false,
    },
  });
}

export async function getMyPostings(memberId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.job.findMany({
      where: { postedById: memberId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    }),
    prisma.job.count({ where: { postedById: memberId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function updateMyJob(jobId: string, memberId: string, data: UpdateJobInput) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  if (job.postedById !== memberId) {
    throw Object.assign(new Error('Not authorized to edit this job'), { statusCode: 403 });
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);

  return prisma.job.update({
    where: { id: jobId },
    data: updateData,
  });
}

export async function deleteMyJob(jobId: string, memberId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  if (job.postedById !== memberId) {
    throw Object.assign(new Error('Not authorized to delete this job'), { statusCode: 403 });
  }
  await prisma.job.delete({ where: { id: jobId } });
  return { message: 'Job deleted successfully' };
}

// Job Applications
export async function applyToJob(jobId: string, applicantId: string, data: ApplyToJobInput) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  if (!job.isApproved) throw Object.assign(new Error('Job is not yet approved'), { statusCode: 400 });
  if (job.postedById === applicantId) {
    throw Object.assign(new Error('You cannot apply to your own job posting'), { statusCode: 400 });
  }
  if (job.expiresAt && job.expiresAt < new Date()) {
    throw Object.assign(new Error('This job posting has expired'), { statusCode: 400 });
  }

  return prisma.jobApplication.create({
    data: {
      jobId,
      applicantId,
      coverLetter: data.coverLetter,
      resumeUrl: data.resumeUrl || null,
    },
    include: {
      job: { select: { id: true, title: true, company: true } },
    },
  });
}

export async function getMyApplications(applicantId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { applicantId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { id: true, title: true, company: true, location: true, jobType: true } },
      },
    }),
    prisma.jobApplication.count({ where: { applicantId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getJobApplications(jobId: string, memberId: string, query: Record<string, string | undefined>) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  if (job.postedById !== memberId) {
    throw Object.assign(new Error('Not authorized to view applications for this job'), { statusCode: 403 });
  }

  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { jobId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: { select: { id: true, fullName: true, email: true, photoUrl: true, occupation: true, areaOfExpertise: true } },
      },
    }),
    prisma.jobApplication.count({ where: { jobId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function updateApplicationStatus(applicationId: string, memberId: string, data: UpdateApplicationStatusInput) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: { select: { postedById: true } } },
  });
  if (!application) throw Object.assign(new Error('Application not found'), { statusCode: 404 });
  if (application.job.postedById !== memberId) {
    throw Object.assign(new Error('Not authorized to update this application'), { statusCode: 403 });
  }

  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: data.status, notes: data.notes },
    include: {
      applicant: { select: { id: true, fullName: true, email: true } },
      job: { select: { id: true, title: true } },
    },
  });
}

// Admin services
export async function adminListAllJobs(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search } = query;

  const where: Record<string, unknown> = {};
  if (status === 'pending') where.isApproved = false;
  else if (status === 'approved') where.isApproved = true;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        postedBy: { select: { id: true, fullName: true, email: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminListPendingJobs(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.job.findMany({
      where: { isApproved: false },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { postedBy: { select: { id: true, fullName: true, email: true } } },
    }),
    prisma.job.count({ where: { isApproved: false } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function approveJob(id: string) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

  return prisma.job.update({
    where: { id },
    data: { isApproved: true },
    include: { postedBy: { select: { id: true, fullName: true } } },
  });
}

export async function deleteJob(id: string) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
  await prisma.job.delete({ where: { id } });
  return { message: 'Job removed successfully' };
}

export async function adminGetJobApplications(jobId: string, query: Record<string, string | undefined>) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { jobId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: { select: { id: true, fullName: true, email: true, photoUrl: true, occupation: true } },
      },
    }),
    prisma.jobApplication.count({ where: { jobId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminUpdateApplicationStatus(applicationId: string, data: UpdateApplicationStatusInput) {
  const application = await prisma.jobApplication.findUnique({ where: { id: applicationId } });
  if (!application) throw Object.assign(new Error('Application not found'), { statusCode: 404 });

  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: data.status, notes: data.notes },
    include: {
      applicant: { select: { id: true, fullName: true, email: true } },
      job: { select: { id: true, title: true } },
    },
  });
}
