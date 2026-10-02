import type { BadgeVariant } from '../../components/ui/Badge'
import type { ReportAction, ReportReason, ReportStatus, ReportTargetType } from '../../types'

export const TARGET_LABELS: Record<ReportTargetType, string> = {
  FORUM_POST: 'Forum post',
  FORUM_COMMENT: 'Forum comment',
  JOB: 'Job posting',
  MEMBER: 'Member profile',
}

export const REASON_BADGE: Record<ReportReason, { variant: BadgeVariant; label: string }> = {
  SPAM: { variant: 'warning', label: 'Spam' },
  HARASSMENT: { variant: 'urgent', label: 'Harassment' },
  HATE: { variant: 'urgent', label: 'Hate' },
  SEXUAL: { variant: 'urgent', label: 'Sexual content' },
  VIOLENCE: { variant: 'urgent', label: 'Violence' },
  MISLEADING: { variant: 'warning', label: 'Misleading' },
  OTHER: { variant: 'default', label: 'Other' },
}

export const STATUS_BADGE: Record<ReportStatus, { variant: BadgeVariant; label: string }> = {
  OPEN: { variant: 'pending', label: 'Open' },
  ACTIONED: { variant: 'completed', label: 'Actioned' },
  DISMISSED: { variant: 'archived', label: 'Dismissed' },
}

export const ACTION_LABELS: Record<ReportAction, string> = {
  NONE: 'No action',
  HIDE_CONTENT: 'Content hidden',
  DELETE_CONTENT: 'Content deleted',
  SUSPEND_AUTHOR: 'Author suspended',
}

/** Admin page to inspect the reported content, where one exists. */
export function targetLink(targetType: ReportTargetType, targetId: string): { to: string; label: string } | null {
  switch (targetType) {
    case 'JOB': return { to: `/jobs/${targetId}`, label: 'Open job posting' }
    case 'MEMBER': return { to: `/alumni-registrations/${targetId}`, label: 'Open member profile' }
    // The forum page has no per-post route; it lists posts with their comments.
    case 'FORUM_POST':
    case 'FORUM_COMMENT': return { to: '/forum', label: 'Open forum moderation' }
    default: return null
  }
}
