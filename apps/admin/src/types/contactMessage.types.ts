export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status?: 'new' | 'read' | 'replied' | 'archived'
  isRead?: boolean
  repliedAt?: string
  createdAt: string
}
