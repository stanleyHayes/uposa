import bcrypt from 'bcryptjs';
import { getRepos } from '../../repositories';
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
  const {
    members, donations, events, projects, contactMessages,
    forumPosts, jobs, jobApplications, polls, elections, mentorshipRequests,
    newsletterSubscriptions,
  } = getRepos();

  const now = new Date();

  const [
    totalMembers,
    pendingApprovals,
    activeMembers,
    donationsAgg,
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
    newsletterSubscribers,
    recentMembers,
    recentDonations,
  ] = await Promise.all([
    members.count(),
    members.count({ membershipStatus: 'PENDING', isApproved: false }),
    members.count({ membershipStatus: 'ACTIVE' }),
    donations.aggregate([
      { $match: { status: 'CONFIRMED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    events.count({ status: 'UPCOMING', date: { $gte: now } }),
    projects.count({ status: 'ONGOING' }),
    contactMessages.count({ isRead: false }),
    forumPosts.count(),
    jobs.count(),
    jobs.count({ isApproved: false }),
    polls.count({ status: 'ACTIVE' }),
    elections.count({ status: 'ACTIVE' }),
    mentorshipRequests.count({ status: 'PENDING' }),
    members.count({ isAvailableAsMentor: true, membershipStatus: 'ACTIVE' }),
    jobApplications.count(),
    newsletterSubscriptions.count({ isActive: true }),
    members.findMany({}, {
      projection: 'fullName email membershipStatus createdAt',
      sort: { createdAt: -1 },
      limit: 5,
    }),
    donations.findMany({ status: 'CONFIRMED' }, {
      projection: 'donorName amount currency createdAt',
      sort: { createdAt: -1 },
      limit: 5,
    }),
  ]);

  return {
    overview: {
      totalMembers,
      pendingApprovals,
      activeMembers,
      donationsTotal: donationsAgg[0]?.total || 0,
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
      newsletterSubscribers,
    },
    recentMembers,
    recentDonations,
  };
}

export async function listAdmins(query: Record<string, string | undefined>) {
  const { admins } = getRepos();
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    admins.findMany({}, { projection: '-password', sort: { createdAt: -1 }, skip, limit }),
    admins.count(),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function createAdmin(data: CreateAdminInput) {
  const { admins } = getRepos();
  const existing = await admins.findOne({ email: data.email });
  if (existing) {
    throw Object.assign(new Error('An admin with this email already exists'), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const doc = await admins.create({
    fullName: data.fullName,
    email: data.email,
    password: hashedPassword,
    role: data.role || 'ADMIN',
    isActive: true,
  });

  const { password: _pw, ...safe } = doc as any;
  return safe;
}

export async function updateAdmin(id: string, data: UpdateAdminInput) {
  const { admins } = getRepos();
  const admin = await admins.findById(id);
  if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });

  const result = await admins.updateById(id, data);
  const { password: _pw, ...safe } = result as any;
  return safe;
}

export async function updateOwnProfile(adminId: string, data: { fullName?: string; email?: string }) {
  const { admins } = getRepos();
  const admin = await admins.findById(adminId);
  if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });

  if (data.email && data.email !== admin.email) {
    const existing = await admins.findOne({ email: data.email });
    if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
  }

  const result = await admins.updateById(adminId, data as Record<string, unknown>);
  const { password: _pw, ...safe } = result as any;
  return safe;
}

export async function changeAdminPassword(adminId: string, currentPassword: string, newPassword: string) {
  const { admins } = getRepos();
  const admin = await admins.findById(adminId);
  if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });

  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await admins.updateById(adminId, { password: hashed });
  return { message: 'Password changed successfully' };
}

export async function deactivateAdmin(id: string, requesterId: string) {
  const { admins } = getRepos();
  if (id === requesterId) {
    throw Object.assign(new Error('You cannot deactivate your own account'), { statusCode: 400 });
  }
  const admin = await admins.findById(id);
  if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });

  const result = await admins.updateById(id, { isActive: false });
  const { password: _pw, ...safe } = result as any;
  return safe;
}
