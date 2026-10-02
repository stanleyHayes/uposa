/**
 * User-generated-content reports (Apple guideline 1.2 / Google Play UGC policy):
 * members report posts, comments, jobs or members; enough distinct reports
 * auto-hide forum content; admins review and act.
 */
import mongoose from 'mongoose';
import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { notify } from '../../utils/notify';
import { excerpt, planReportResolution, shouldAutoHide, ReportTargetType } from '../../utils/moderation.utils';
import { IContentReport, ReportStatus, ReportTargetType as TARGET_TYPES } from '../../models';
import { suspendMember } from '../members/members.service';
import { CreateReportInput, ResolveReportInput } from './reports.validation';

const TARGET_LABELS: Record<ReportTargetType, string> = {
  FORUM_POST: 'forum post',
  FORUM_COMMENT: 'forum comment',
  JOB: 'job post',
  MEMBER: 'member',
};

/** The reported record (just what moderation needs) and its member author (null for admin-posted jobs). */
interface LoadedTarget {
  doc: { id: unknown; autoHidden?: boolean } | null;
  authorId: string | null;
}

async function loadTarget(type: ReportTargetType, id: string): Promise<LoadedTarget> {
  const repos = getRepos();
  const result = (doc: { id: unknown; autoHidden?: boolean } | null, authorId: unknown): LoadedTarget =>
    ({ doc, authorId: doc && authorId ? String(authorId) : null });
  switch (type) {
    case 'FORUM_POST': {
      const post = await repos.forumPosts.findById(id);
      return result(post, post?.authorId);
    }
    case 'FORUM_COMMENT': {
      const comment = await repos.forumComments.findById(id);
      return result(comment, comment?.authorId);
    }
    case 'JOB': {
      const job = await repos.jobs.findById(id);
      return result(job, job?.postedById);
    }
    case 'MEMBER': {
      const member = await repos.members.findById(id, { projection: 'fullName membershipStatus' });
      return member && member.membershipStatus !== 'DELETED' ? result(member, id) : result(null, null);
    }
  }
}

async function distinctOpenReporters(type: ReportTargetType, targetId: string): Promise<number> {
  const rows = await getRepos().contentReports.aggregate<{ n: number }>([
    { $match: { targetType: type, targetId: new mongoose.Types.ObjectId(targetId), status: 'OPEN' } },
    { $group: { _id: '$reporterId' } },
    { $count: 'n' },
  ]);
  return rows[0]?.n ?? 0;
}

/** Returns the report id and whether it was newly created (idempotent per reporter+target while OPEN). */
export async function createReport(reporterId: string, data: CreateReportInput): Promise<{ id: string; created: boolean }> {
  const { contentReports, forumPosts, forumComments } = getRepos();
  const { doc, authorId } = await loadTarget(data.targetType, data.targetId);
  if (!doc) throw Object.assign(new Error('Reported content not found'), { statusCode: 404 });
  if (authorId && authorId === String(reporterId)) {
    throw Object.assign(new Error('You cannot report yourself or your own content'), { statusCode: 400 });
  }

  const key = { reporterId, targetType: data.targetType, targetId: data.targetId, status: 'OPEN' };
  const existing = await contentReports.findOne(key);
  if (existing) return { id: String(existing.id), created: false };

  let report;
  try {
    report = await contentReports.create({ ...key, reason: data.reason, details: data.details || null });
  } catch (err) {
    // Concurrent duplicate: the partial unique index (one OPEN report per reporter+target) caught it.
    if ((err as { code?: number }).code !== 11000) throw err;
    const raced = await contentReports.findOne(key);
    if (!raced) throw err;
    return { id: String(raced.id), created: false };
  }

  notify('CONTENT_REPORT', 'Content reported', `A ${TARGET_LABELS[data.targetType]} was reported (${data.reason.toLowerCase()}).`, '/reports');

  // Enough distinct members reporting forum content hides it until a moderator reviews.
  if (shouldAutoHide(data.targetType, await distinctOpenReporters(data.targetType, data.targetId))) {
    const repo = data.targetType === 'FORUM_POST' ? forumPosts : forumComments;
    await repo.updateOne({ _id: data.targetId, isHidden: { $ne: true } }, { isHidden: true, autoHidden: true });
  }

  return { id: String(report.id), created: true };
}

/** Attach reporter, open-report count and a summary of the target to each report. */
async function enrichReports(reports: IContentReport[]) {
  const repos = getRepos();
  if (reports.length === 0) return [];

  const idsOf = (type: ReportTargetType) => [...new Set(reports.filter((r) => r.targetType === type).map((r) => String(r.targetId)))];
  const [posts, comments, jobs, memberTargets, reporters, counts] = await Promise.all([
    idsOf('FORUM_POST').length ? repos.forumPosts.findMany({ _id: { $in: idsOf('FORUM_POST') } }, { projection: 'title content authorId isHidden' }) : [],
    idsOf('FORUM_COMMENT').length ? repos.forumComments.findMany({ _id: { $in: idsOf('FORUM_COMMENT') } }, { projection: 'content authorId isHidden postId' }) : [],
    idsOf('JOB').length ? repos.jobs.findMany({ _id: { $in: idsOf('JOB') } }, { projection: 'title description postedById isApproved' }) : [],
    idsOf('MEMBER').length ? repos.members.findMany({ _id: { $in: idsOf('MEMBER') } }, { projection: 'fullName occupation organization membershipStatus' }) : [],
    repos.members.findMany({ _id: { $in: [...new Set(reports.map((r) => String(r.reporterId)))] } }, { projection: 'fullName' }),
    repos.contentReports.aggregate<{ _id: { t: string; id: unknown }; n: number }>([
      { $match: { status: 'OPEN', targetId: { $in: [...new Set(reports.map((r) => String(r.targetId)))].map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: { t: '$targetType', id: '$targetId' }, n: { $sum: 1 } } },
    ]),
  ]);

  const parentPostIds = [...new Set(comments.map((c) => String(c.postId)))];
  const authorIds = [...new Set([
    ...posts.map((p) => p.authorId), ...comments.map((c) => c.authorId), ...jobs.map((j) => j.postedById),
  ].filter(Boolean).map(String))];
  const [parentPosts, authors] = await Promise.all([
    parentPostIds.length ? repos.forumPosts.findMany({ _id: { $in: parentPostIds } }, { projection: 'title' }) : [],
    authorIds.length ? repos.members.findMany({ _id: { $in: authorIds } }, { projection: 'fullName' }) : [],
  ]);

  const byId = <T extends { id: unknown }>(docs: T[]) => new Map(docs.map((d) => [String(d.id), d]));
  const postMap = byId(posts), commentMap = byId(comments), jobMap = byId(jobs), memberMap = byId(memberTargets);
  const parentMap = byId(parentPosts), authorMap = byId(authors), reporterMap = byId(reporters);
  const countMap = new Map(counts.map((c) => [`${c._id.t}:${String(c._id.id)}`, c.n]));
  const nameOf = (id: unknown) => (id ? authorMap.get(String(id))?.fullName : undefined);

  const summarize = (type: string, id: string) => {
    switch (type) {
      case 'FORUM_POST': {
        const p = postMap.get(id);
        return p ? { exists: true, title: p.title, excerpt: excerpt(p.content), authorId: String(p.authorId), authorName: nameOf(p.authorId), isHidden: !!p.isHidden } : null;
      }
      case 'FORUM_COMMENT': {
        const c = commentMap.get(id);
        return c ? { exists: true, title: parentMap.get(String(c.postId))?.title, excerpt: excerpt(c.content), authorId: String(c.authorId), authorName: nameOf(c.authorId), isHidden: !!c.isHidden } : null;
      }
      case 'JOB': {
        const j = jobMap.get(id);
        return j ? { exists: true, title: j.title, excerpt: excerpt(j.description), authorId: j.postedById ? String(j.postedById) : undefined, authorName: nameOf(j.postedById), isHidden: !j.isApproved } : null;
      }
      case 'MEMBER': {
        const m = memberMap.get(id);
        return m && m.membershipStatus !== 'DELETED'
          ? { exists: true, title: m.fullName, excerpt: excerpt([m.occupation, m.organization].filter(Boolean).join(' · ')), authorId: id, authorName: m.fullName }
          : null;
      }
      default:
        return null;
    }
  };

  return reports.map((r) => {
    const targetId = String(r.targetId);
    const reporter = reporterMap.get(String(r.reporterId));
    return {
      id: String(r.id),
      targetType: r.targetType,
      targetId,
      reason: r.reason,
      details: r.details ?? null,
      status: r.status,
      action: r.action ?? null,
      resolutionNote: r.resolutionNote ?? null,
      resolvedById: r.resolvedById ? String(r.resolvedById) : null,
      resolvedAt: r.resolvedAt ?? null,
      createdAt: r.createdAt,
      reporter: reporter ? { id: String(reporter.id), fullName: reporter.fullName } : null,
      reportCount: countMap.get(`${r.targetType}:${targetId}`) ?? 0,
      target: summarize(r.targetType, targetId) ?? { exists: false, excerpt: '' },
    };
  });
}

export async function adminListReports(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();
  const status = (query.status || 'OPEN').toUpperCase();
  const targetType = (query.targetType || '').toUpperCase();

  const where: Record<string, unknown> = {};
  if (status !== 'ALL') where.status = (ReportStatus as readonly string[]).includes(status) ? status : 'OPEN';
  if ((TARGET_TYPES as readonly string[]).includes(targetType)) where.targetType = targetType;

  const [raw, total, openCount] = await Promise.all([
    repos.contentReports.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    repos.contentReports.count(where),
    repos.contentReports.count({ status: 'OPEN' }),
  ]);

  return { data: await enrichReports(raw), meta: { ...buildPaginationMeta(page, limit, total), openCount } };
}

export async function adminGetReport(id: string) {
  const report = await getRepos().contentReports.findById(id);
  if (!report) throw Object.assign(new Error('Report not found'), { statusCode: 404 });
  return (await enrichReports([report]))[0];
}

/**
 * Apply the moderator's decision to the reported content, then resolve every
 * OPEN report on the same target with the same outcome.
 */
export async function resolveReport(id: string, admin: { id: string; role: string }, data: ResolveReportInput) {
  const repos = getRepos();
  const report = await repos.contentReports.findById(id);
  if (!report) throw Object.assign(new Error('Report not found'), { statusCode: 404 });
  if (report.status !== 'OPEN') throw Object.assign(new Error('This report has already been resolved'), { statusCode: 409 });

  const type = report.targetType as ReportTargetType;
  const targetId = String(report.targetId);
  const plan = planReportResolution(type, data.status, data.action);
  if (plan.requiresAdminRole && admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
    throw Object.assign(new Error('Only an ADMIN or SUPER_ADMIN can suspend members'), { statusCode: 403 });
  }

  const { doc, authorId } = await loadTarget(type, targetId);
  const gone = () => Object.assign(new Error('The reported content no longer exists; resolve with action NONE'), { statusCode: 409 });
  const forumRepo = type === 'FORUM_POST' ? repos.forumPosts : repos.forumComments;

  if (plan.hide) {
    if (!doc) throw gone();
    await forumRepo.updateById(targetId, { isHidden: true, autoHidden: false });
  }
  if (plan.unapproveJob) {
    if (!doc) throw gone();
    await repos.jobs.updateById(targetId, { isApproved: false });
  }
  if (plan.deleteContent && doc) {
    if (type === 'FORUM_POST') {
      await Promise.all([repos.forumPosts.deleteById(targetId), repos.forumComments.deleteMany({ postId: targetId })]);
    } else if (type === 'FORUM_COMMENT') {
      await repos.forumComments.deleteById(targetId);
    } else if (type === 'JOB') {
      await Promise.all([repos.jobs.deleteById(targetId), repos.jobApplications.deleteMany({ jobId: targetId })]);
    }
  }
  if (plan.suspendAuthor) {
    if (!authorId) throw Object.assign(new Error('This content has no member author to suspend'), { statusCode: 409 });
    await suspendMember(authorId); // also invalidates their session
  }
  if (plan.unhideIfAutoHidden && doc?.autoHidden) {
    await forumRepo.updateOne({ _id: targetId, autoHidden: true }, { isHidden: false, autoHidden: false });
  }

  await repos.contentReports.updateMany(
    { targetType: type, targetId, status: 'OPEN' },
    {
      status: data.status,
      action: plan.action,
      resolutionNote: data.resolutionNote || null,
      resolvedById: admin.id,
      resolvedAt: new Date(),
    },
  );

  return adminGetReport(id);
}
