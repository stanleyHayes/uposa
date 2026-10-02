import bcrypt from 'bcryptjs';
import { getRepos, type IRepository } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { emailMatch } from '../../utils/search.utils';
import { signAdminToken, signAdminRefreshToken } from '../../utils/jwt.utils';
import { invalidateAdminSession } from '../../utils/session-state.utils';
import { loadRole } from '../roles/roles.access';
import { Actor, assertAdminChangeAllowed, assertNoEscalation, activeSuperAdminCount } from '../roles/roles.service';
import { SUPER_ADMIN_ROLE, forbiddenMessage } from '../../config/permissions';

/** Admin record without credentials (password hash, reset-token hash). */
export function toSafeAdmin<T extends object>(admin: T): Omit<T, 'password' | 'resetTokenHash' | 'resetTokenExpiry'> {
  const { password: _pw, resetTokenHash: _rth, resetTokenExpiry: _rte, ...safe } = admin as T & {
    password?: unknown; resetTokenHash?: unknown; resetTokenExpiry?: unknown;
  };
  return safe;
}

async function assertEmailFree(email: string, exceptId?: string) {
  const existing = await getRepos().admins.findOne({ email: emailMatch(email) });
  if (existing && String((existing as { id: unknown }).id) !== exceptId) {
    throw Object.assign(new Error('An admin with this email already exists'), { statusCode: 409 });
  }
}

interface CreateAdminInput {
  fullName: string;
  email: string;
  password: string;
  role?: string;
}

interface UpdateAdminInput {
  fullName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

/** A role key that exists (system or custom); 404 otherwise. */
async function requireRole(key: string) {
  const role = await loadRole(key);
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  return role;
}

interface MonthlyAggregateRow {
  _id: { year: number; month: number };
  count?: number;
  total?: number;
}

interface TotalsAggregateRow {
  _id: string | null;
  total?: number;
  count?: number;
}

interface ProjectFundingAggregateRow {
  _id: string | null;
  goal?: number;
  raised?: number;
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function buildMonthSlots(now: Date, length = 6) {
  return Array.from({ length }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (length - 1 - index), 1);
    return {
      key: monthKey(date.getFullYear(), date.getMonth() + 1),
      label: date.toLocaleString('en-US', { month: 'short' }),
    };
  });
}

function mapMonthlyRows(rows: MonthlyAggregateRow[], valueField: 'count' | 'total' = 'count') {
  return new Map(
    rows.map((row) => [
      monthKey(row._id.year, row._id.month),
      Number(row[valueField] || 0),
    ]),
  );
}

export async function getDashboardStats() {
  const {
    members, donations, events, projects, contactMessages,
    forumPosts, jobs, jobApplications, polls, elections, mentorshipRequests,
    newsletterSubscriptions, dues, news, eventRsvps, forumComments, pollVotes,
    electionVotes, galleryItems, schoolLeaders, executives, paymentMethods,
    transcriptRequests, admins,
  } = getRepos();

  const now = new Date();
  const monthSlots = buildMonthSlots(now);
  const timelineStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  async function monthlyCount<T>(
    repo: IRepository<T>,
    match: Record<string, unknown> = {},
    dateField = 'createdAt',
  ) {
    return mapMonthlyRows(await repo.aggregate<MonthlyAggregateRow>([
      { $match: { ...match, [dateField]: { $gte: timelineStart } } },
      {
        $group: {
          _id: { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` } },
          count: { $sum: 1 },
        },
      },
    ]));
  }

  async function monthlySum<T>(
    repo: IRepository<T>,
    sumField: string,
    match: Record<string, unknown> = {},
    dateField = 'createdAt',
  ) {
    return mapMonthlyRows(await repo.aggregate<MonthlyAggregateRow>([
      { $match: { ...match, [dateField]: { $gte: timelineStart } } },
      {
        $group: {
          _id: { year: { $year: `$${dateField}` }, month: { $month: `$${dateField}` } },
          total: { $sum: `$${sumField}` },
        },
      },
    ]), 'total');
  }

  const [
    totalMembers,
    pendingApprovals,
    activeMembers,
    donationsAgg,
    confirmedDonationsCount,
    pendingDonationsCount,
    upcomingEventsCount,
    activeProjectsCount,
    unreadMessagesCount,
    totalForumPosts,
    totalForumComments,
    totalJobs,
    pendingJobs,
    activePolls,
    activeElections,
    pendingMentorshipRequests,
    totalMentors,
    totalJobApplications,
    newsletterSubscribers,
    publishedNewsCount,
    draftNewsCount,
    eventRsvpCount,
    pollVoteCount,
    electionVoteCount,
    paidDuesAgg,
    pendingDuesAgg,
    overdueDuesCount,
    galleryItemCount,
    activeSchoolLeadersCount,
    activeExecutivesCount,
    enabledPaymentMethodsCount,
    pendingTranscriptRequestsCount,
    totalAdmins,
    activeAdmins,
    projectFundingAgg,
    donationsByChannelAgg,
    duesByStatusAgg,
    membersByMonth,
    donationsByMonth,
    newsByMonth,
    eventsByMonth,
    forumByMonth,
    rsvpsByMonth,
    recentMembers,
    recentDonations,
    recentMessages,
    recentJobs,
  ] = await Promise.all([
    members.count({ membershipStatus: { $ne: 'DELETED' } }),
    members.count({ membershipStatus: 'PENDING', isApproved: false }),
    members.count({ membershipStatus: 'ACTIVE' }),
    donations.aggregate([
      { $match: { status: 'CONFIRMED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    donations.count({ status: 'CONFIRMED' }),
    donations.count({ status: 'PENDING' }),
    events.count({ status: 'UPCOMING', date: { $gte: now } }),
    projects.count({ status: 'ONGOING' }),
    contactMessages.count({ isRead: false }),
    forumPosts.count(),
    forumComments.count(),
    jobs.count(),
    jobs.count({ isApproved: false }),
    polls.count({ status: 'ACTIVE' }),
    elections.count({ status: 'ACTIVE' }),
    mentorshipRequests.count({ status: 'PENDING' }),
    members.count({ isAvailableAsMentor: true, membershipStatus: 'ACTIVE' }),
    jobApplications.count(),
    newsletterSubscriptions.count({ isActive: true }),
    news.count({ isPublished: true }),
    news.count({ isPublished: false }),
    eventRsvps.count(),
    pollVotes.count(),
    electionVotes.count(),
    dues.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    dues.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    dues.count({ status: 'OVERDUE' }),
    galleryItems.count(),
    schoolLeaders.count({ isActive: true }),
    executives.count({ isActive: true }),
    paymentMethods.count({ isEnabled: true }),
    transcriptRequests.count({ status: 'PENDING' }),
    admins.count(),
    admins.count({ isActive: true }),
    projects.aggregate<ProjectFundingAggregateRow>([
      { $group: { _id: null, goal: { $sum: '$goalAmount' }, raised: { $sum: '$raisedAmount' } } },
    ]),
    donations.aggregate<TotalsAggregateRow>([
      { $match: { status: 'CONFIRMED' } },
      { $group: { _id: '$channel', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    dues.aggregate<TotalsAggregateRow>([
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    monthlyCount(members),
    monthlySum(donations, 'amount', { status: 'CONFIRMED' }),
    monthlyCount(news, { isPublished: true }, 'publishedAt'),
    monthlyCount(events),
    monthlyCount(forumPosts),
    monthlyCount(eventRsvps),
    members.findMany({ membershipStatus: { $ne: 'DELETED' } }, {
      projection: 'fullName email membershipStatus createdAt',
      sort: { createdAt: -1 },
      limit: 5,
    }),
    donations.findMany({ status: 'CONFIRMED' }, {
      projection: 'donorName amount currency createdAt',
      sort: { createdAt: -1 },
      limit: 5,
    }),
    contactMessages.findMany({}, {
      projection: 'name subject isRead createdAt',
      sort: { createdAt: -1 },
      limit: 5,
    }),
    jobs.findMany({ isApproved: false }, {
      projection: 'title company createdAt',
      sort: { createdAt: -1 },
      limit: 5,
    }),
  ]);

  const activityTrend = monthSlots.map((slot) => ({
    ...slot,
    members: membersByMonth.get(slot.key) || 0,
    donations: donationsByMonth.get(slot.key) || 0,
    content: (newsByMonth.get(slot.key) || 0) + (forumByMonth.get(slot.key) || 0),
    engagement: rsvpsByMonth.get(slot.key) || 0,
    events: eventsByMonth.get(slot.key) || 0,
  }));

  return {
    overview: {
      totalMembers,
      pendingApprovals,
      activeMembers,
      donationsTotal: donationsAgg[0]?.total || 0,
      confirmedDonationsCount,
      pendingDonationsCount,
      upcomingEventsCount,
      activeProjectsCount,
      unreadMessagesCount,
      totalForumPosts,
      totalForumComments,
      totalJobs,
      pendingJobs,
      activePolls,
      activeElections,
      pendingMentorshipRequests,
      totalMentors,
      totalJobApplications,
      newsletterSubscribers,
      publishedNewsCount,
      draftNewsCount,
      eventRsvpCount,
      pollVoteCount,
      electionVoteCount,
      paidDuesTotal: paidDuesAgg[0]?.total || 0,
      paidDuesCount: paidDuesAgg[0]?.count || 0,
      pendingDuesTotal: pendingDuesAgg[0]?.total || 0,
      pendingDuesCount: pendingDuesAgg[0]?.count || 0,
      overdueDuesCount,
      galleryItemCount,
      activeSchoolLeadersCount,
      activeExecutivesCount,
      enabledPaymentMethodsCount,
      pendingTranscriptRequestsCount,
      totalAdmins,
      activeAdmins,
      projectFundingGoal: projectFundingAgg[0]?.goal || 0,
      projectFundingRaised: projectFundingAgg[0]?.raised || 0,
    },
    activityTrend,
    financials: {
      donationsByChannel: donationsByChannelAgg.map((channel) => ({
        channel: channel._id || 'OTHER',
        total: channel.total || 0,
        count: channel.count || 0,
      })),
      duesByStatus: duesByStatusAgg.map((status) => ({
        status: status._id || 'UNKNOWN',
        total: status.total || 0,
        count: status.count || 0,
      })),
    },
    recentMembers,
    recentDonations,
    recentMessages,
    recentJobs,
  };
}

export async function listAdmins(query: Record<string, string | undefined>) {
  const { admins } = getRepos();
  const { page, limit, skip } = getPaginationParams(query);

  const [rawData, total, roleDocs] = await Promise.all([
    admins.findMany({}, { projection: '-password -resetTokenHash -resetTokenExpiry', sort: { createdAt: -1 }, skip, limit }),
    admins.count(),
    getRepos().roles.findMany({}, { projection: 'key name' }),
  ]);

  // roleInfo resolves custom role keys to their display names.
  const names = new Map(roleDocs.map((r) => [r.key, r.name]));
  const data = await Promise.all(rawData.map(async (a) => {
    const name = names.get(a.role) ?? (await loadRole(a.role))?.name ?? a.role;
    return { ...a, roleInfo: { key: a.role, name } };
  }));

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function createAdmin(actor: Actor, data: CreateAdminInput) {
  const { admins } = getRepos();
  await assertEmailFree(data.email);

  const role = await requireRole(data.role || 'ADMIN');
  if (role.key === SUPER_ADMIN_ROLE && actor.role !== SUPER_ADMIN_ROLE) {
    throw Object.assign(new Error('Only a SUPER_ADMIN can assign or remove the SUPER_ADMIN role'), { statusCode: 403 });
  }
  // A new account can't hold more than its creator (else: create a stronger login for yourself).
  assertNoEscalation(actor, role.permissions);

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const doc = await admins.create({
    fullName: data.fullName,
    email: data.email,
    password: hashedPassword,
    role: role.key,
    isActive: true,
  });

  return toSafeAdmin(doc);
}

export async function updateAdmin(actor: Actor, id: string, data: UpdateAdminInput) {
  const { admins } = getRepos();
  const admin = await admins.findById(id);
  if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });
  if (data.email) await assertEmailFree(data.email, id);

  const roleChanges = data.role !== undefined && data.role !== admin.role;
  if (roleChanges) {
    // Changing someone's role is a permissions change, not just an account edit.
    if (!actor.permissions.includes('roles:edit')) {
      throw Object.assign(new Error(forbiddenMessage('roles:edit')), { statusCode: 403 });
    }
    const role = await requireRole(data.role as string);
    assertNoEscalation(actor, role.permissions);
  }
  assertAdminChangeAllowed({
    actor,
    target: { id: String(admin.id), role: admin.role, isActive: admin.isActive },
    newRole: data.role,
    deactivating: data.isActive === false && admin.isActive,
    activeSuperAdminCount: await activeSuperAdminCount(),
  });

  const result = await admins.updateById(id, data);
  invalidateAdminSession(id); // deactivation / role change applies on the next request
  return toSafeAdmin(result!);
}

export async function updateOwnProfile(adminId: string, data: { fullName?: string; email?: string }) {
  const { admins } = getRepos();
  const admin = await admins.findById(adminId);
  if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });

  if (data.email) await assertEmailFree(data.email, adminId);

  const result = await admins.updateById(adminId, data as Record<string, unknown>);
  return toSafeAdmin(result!);
}

export async function changeAdminPassword(adminId: string, currentPassword: string, newPassword: string) {
  const { admins } = getRepos();
  const admin = await admins.findById(adminId);
  if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });

  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await admins.updateById(adminId, { password: hashed, passwordChangedAt: new Date() });
  invalidateAdminSession(adminId);

  // Older refresh tokens are now revoked; hand this device a fresh session.
  const tokenPayload = { id: String(admin.id), email: admin.email, role: admin.role };
  return {
    message: 'Password changed successfully',
    accessToken: signAdminToken(tokenPayload),
    refreshToken: signAdminRefreshToken(tokenPayload),
  };
}

export async function deactivateAdmin(id: string, actor: Actor) {
  const { admins } = getRepos();
  if (id === actor.id) {
    throw Object.assign(new Error('You cannot deactivate your own account'), { statusCode: 400 });
  }
  const admin = await admins.findById(id);
  if (!admin) throw Object.assign(new Error('Admin not found'), { statusCode: 404 });
  assertAdminChangeAllowed({
    actor,
    target: { id: String(admin.id), role: admin.role, isActive: admin.isActive },
    deactivating: admin.isActive,
    activeSuperAdminCount: await activeSuperAdminCount(),
  });

  const result = await admins.updateById(id, { isActive: false });
  invalidateAdminSession(id);
  return toSafeAdmin(result!);
}
