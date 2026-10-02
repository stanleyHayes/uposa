export type ReportTargetType = 'FORUM_POST' | 'FORUM_COMMENT' | 'JOB' | 'MEMBER'
export type ReportReason = 'SPAM' | 'HARASSMENT' | 'HATE' | 'SEXUAL' | 'VIOLENCE' | 'MISLEADING' | 'OTHER'
export type ReportStatus = 'OPEN' | 'ACTIONED' | 'DISMISSED'
export type ReportAction = 'NONE' | 'HIDE_CONTENT' | 'DELETE_CONTENT' | 'SUSPEND_AUTHOR'

/** A member's report on a piece of user-generated content, as returned by /admin/reports. */
export interface ContentReport {
  id: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  details?: string | null
  status: ReportStatus
  action?: ReportAction | null
  resolutionNote?: string | null
  resolvedAt?: string | null
  createdAt: string
  reporter: { id: string; fullName: string } | null
  /** Open reports on the same target (the moderation threshold counts these). */
  reportCount: number
  target: {
    exists: boolean
    title?: string | null
    excerpt: string
    authorId?: string | null
    authorName?: string | null
    isHidden?: boolean
  }
}

export interface ResolveReportInput {
  status: 'ACTIONED' | 'DISMISSED'
  action?: ReportAction
  resolutionNote?: string
}
