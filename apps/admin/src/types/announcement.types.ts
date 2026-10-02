export type AnnouncementType = 'info' | 'warning' | 'urgent' | 'success'
export type AnnouncementStatus = 'draft' | 'published' | 'archived'
export type AnnouncementAudience = 'All' | 'Members Only' | 'Executives Only'

export interface Announcement {
  id: string
  title: string
  body: string
  type: AnnouncementType
  status: AnnouncementStatus
  publishedAt: string
  expiresAt: string
  targetAudience: AnnouncementAudience
  createdBy: string
  createdAt: string
  updatedAt: string
}

// API shapes (/announcements/admin) and mapping to the UI forms above.
export type ApiAnnouncementType = 'INFO' | 'WARNING' | 'URGENT' | 'SUCCESS'
export type ApiAnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type ApiAnnouncementAudience = 'ALL' | 'MEMBERS' | 'EXECUTIVES'

export interface ApiAnnouncement {
  id: string
  title: string
  body: string
  type: ApiAnnouncementType
  status: ApiAnnouncementStatus
  audience: ApiAnnouncementAudience
  publishedAt: string | null
  expiresAt: string | null
  createdBy: { id: string; fullName: string } | null
  createdAt: string
  updatedAt: string
}

export const AUDIENCE_FROM_API: Record<ApiAnnouncementAudience, AnnouncementAudience> = {
  ALL: 'All',
  MEMBERS: 'Members Only',
  EXECUTIVES: 'Executives Only',
}

export const AUDIENCE_TO_API: Record<AnnouncementAudience, ApiAnnouncementAudience> = {
  All: 'ALL',
  'Members Only': 'MEMBERS',
  'Executives Only': 'EXECUTIVES',
}

export function toAnnouncement(a: ApiAnnouncement): Announcement {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    type: a.type.toLowerCase() as AnnouncementType,
    status: a.status.toLowerCase() as AnnouncementStatus,
    publishedAt: a.publishedAt ?? '',
    expiresAt: a.expiresAt ?? '',
    targetAudience: AUDIENCE_FROM_API[a.audience] ?? 'All',
    createdBy: a.createdBy?.fullName ?? '',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }
}
