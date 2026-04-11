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
