import bcrypt from 'bcryptjs';
import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';

interface CreateAdminInput {
  fullName: string;
  email: string;
  password: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
}

interface UpdateAdminInput {
  fullName?: string;
  email?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
  isActive?: boolean;
}

export async function getDashboardStats() {
  const now = new Date();

  const [
    totalMembers,
    pendingApprovals,
    activeMembers,
    donationsTotal,
    upcomingEventsCount,
    activeProjectsCount,
    unreadMessagesCount,
    totalForumPosts,
    totalJobs,
    pendingJobs,
    activePolls,
    activeElections,
    pendingMentorshipRequests,
    totalMentors,
    totalJobApplications,
    recentMembers,
    recentDonations,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { membershipStatus: 'PENDING', isApproved: false } }),
    prisma.member.count({ where: { membershipStatus: 'ACTIVE' } }),
    prisma.donation.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { amount: true },
    }),
    prisma.event.count({ where: { status: 'UPCOMING', date: { gte: now } } }),
    prisma.project.count({ where: { status: 'ONGOING' } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.forumPost.count(),
    prisma.job.count(),
    prisma.job.count({ where: { isApproved: false } }),
    prisma.poll.count({ where: { status: 'ACTIVE' } }),
    prisma.election.count({ where: { status: 'ACTIVE' } }),
    prisma.mentorshipRequest.count({ where: { status: 'PENDING' } }),
    prisma.member.count({ where: { isAvailableAsMentor: true, membershipStatus: 'ACTIVE' } }),
    prisma.jobApplication.count(),
    prisma.member.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        membershipStatus: true,
        createdAt: true,
      },
    }),
    prisma.donation.findMany({
      take: 5,
      where: { status: 'CONFIRMED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        donorName: true,
        amount: true,
        currency: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    overview: {
      totalMembers,
      pendingApprovals,
      activeMembers,
      donationsTotal: donationsTotal._sum.amount || 0,
      upcomingEventsCount,
      activeProjectsCount,
      unreadMessagesCount,
      totalForumPosts,
      totalJobs,
      pendingJobs,
      activePolls,
      activeElections,
      pendingMentorshipRequests,
      totalMentors,
      totalJobApplications,
    },
    recentMembers,
    recentDonations,
  };
}

export async function listAdmins(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.admin.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.admin.count(),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function createAdmin(data: CreateAdminInput) {
  const existing = await prisma.admin.findUnique({ where: { email: data.email } });
  if (existing) {
    throw Object.assign(new Error('An admin with this email already exists'), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const admin = await prisma.admin.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'ADMIN',
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return admin;
}

export async function updateAdmin(id: string, data: UpdateAdminInput) {
  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });

  return prisma.admin.update({
    where: { id },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });
}

export async function deactivateAdmin(id: string, requesterId: string) {
  if (id === requesterId) {
    throw Object.assign(new Error('You cannot deactivate your own account'), { statusCode: 400 });
  }
  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });

  return prisma.admin.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, fullName: true, email: true, isActive: true },
  });
}
