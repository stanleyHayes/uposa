export type ContactMessageStatus = 'new' | 'read' | 'replied' | 'archived'

/** Contact message as returned by /contact/admin; the UI status is derived from these flags. */
export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  repliedAt?: string | null
  isArchived?: boolean
  archivedAt?: string | null
  createdAt: string
}
