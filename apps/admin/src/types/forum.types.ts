export type ForumCategory = 'General' | 'Announcements' | 'Career' | 'Alumni Stories' | 'Feedback'
export type ThreadStatus = 'open' | 'pinned' | 'closed' | 'deleted'
export type ReplyStatus = 'active' | 'hidden' | 'flagged'

export interface ForumReply {
  id: string
  threadId: string
  authorName: string
  authorEmail: string
  body: string
  status: ReplyStatus
  createdAt: string
}

export interface ForumThread {
  id: string
  title: string
  body: string
  authorName: string
  authorEmail: string
  category: ForumCategory
  status: ThreadStatus
  replyCount: number
  createdAt: string
  updatedAt: string
}
