/**
 * Pure moderation rules: report auto-hide threshold, how an admin resolution
 * maps to effects, and the visibility filters for hidden/blocked content.
 */
import mongoose from 'mongoose';

export type ReportTargetType = 'FORUM_POST' | 'FORUM_COMMENT' | 'JOB' | 'MEMBER';
export type ReportResolutionStatus = 'ACTIONED' | 'DISMISSED';
export type ReportActionType = 'NONE' | 'HIDE_CONTENT' | 'DELETE_CONTENT' | 'SUSPEND_AUTHOR';

/** Forum posts/comments are hidden automatically once this many distinct members have open reports on them. */
export const AUTO_HIDE_THRESHOLD = 3;

export function shouldAutoHide(targetType: ReportTargetType, distinctOpenReporters: number): boolean {
  return (targetType === 'FORUM_POST' || targetType === 'FORUM_COMMENT') && distinctOpenReporters >= AUTO_HIDE_THRESHOLD;
}

export interface ResolutionPlan {
  action: ReportActionType;
  /** Set isHidden on a post/comment (moderator hide). */
  hide: boolean;
  /** Unapprove a job (a job's "hide"). */
  unapproveJob: boolean;
  /** Delete the reported content. */
  deleteContent: boolean;
  /** Suspend the content's author, or the member for MEMBER reports. */
  suspendAuthor: boolean;
  /** Undo an automatic hide (DISMISSED). */
  unhideIfAutoHidden: boolean;
  /** Extra permission beyond reports:edit (SUSPEND_AUTHOR is an account action → members:edit). */
  extraPermission: string | null;
}

/**
 * Map an admin's resolution to its effects; throws 400 for combinations that
 * make no sense (e.g. hiding a member, or dismissing while taking an action).
 */
export function planReportResolution(
  targetType: ReportTargetType,
  status: ReportResolutionStatus,
  action: ReportActionType = 'NONE',
): ResolutionPlan {
  const plan: ResolutionPlan = {
    action,
    hide: false,
    unapproveJob: false,
    deleteContent: false,
    suspendAuthor: false,
    unhideIfAutoHidden: false,
    extraPermission: null,
  };
  const invalid = (message: string) => Object.assign(new Error(message), { statusCode: 400 });

  if (status === 'DISMISSED') {
    if (action !== 'NONE') throw invalid('A dismissed report cannot take an action');
    plan.unhideIfAutoHidden = targetType === 'FORUM_POST' || targetType === 'FORUM_COMMENT';
    return plan;
  }

  switch (action) {
    case 'NONE':
      break;
    case 'HIDE_CONTENT':
      if (targetType === 'MEMBER') throw invalid('Members cannot be hidden; use SUSPEND_AUTHOR');
      if (targetType === 'JOB') plan.unapproveJob = true;
      else plan.hide = true;
      break;
    case 'DELETE_CONTENT':
      if (targetType === 'MEMBER') throw invalid('Members cannot be deleted from a report; use SUSPEND_AUTHOR');
      plan.deleteContent = true;
      break;
    case 'SUSPEND_AUTHOR':
      plan.suspendAuthor = true;
      plan.extraPermission = 'members:edit';
      break;
  }
  return plan;
}

/** `{ field: { $nin: ids } }`, or nothing when the list is empty (find() casts string ids). */
export function excludeIds(field: string, ids: string[]): Record<string, unknown> {
  return ids.length ? { [field]: { $nin: ids } } : {};
}

/**
 * Member-facing filter for forum posts/comments: not hidden, and not written by
 * anyone the viewer has blocked. `asObjectIds` for aggregation pipelines, which
 * (unlike find) don't cast strings.
 */
export function visibleForumFilter(blockedIds: string[], asObjectIds = false): Record<string, unknown> {
  const ids = asObjectIds ? blockedIds.map((id) => new mongoose.Types.ObjectId(id)) : blockedIds;
  return { isHidden: { $ne: true }, ...(ids.length ? { authorId: { $nin: ids } } : {}) };
}

/** Collapse whitespace and cut to `max` characters with an ellipsis. */
export function excerpt(text: string | null | undefined, max = 280): string {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}
