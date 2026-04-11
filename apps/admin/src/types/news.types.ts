export type NewsCategory = 'ANNOUNCEMENT' | 'BLOG' | 'REPORT' | 'MEETING_SUMMARY'
export type NewsStatus = 'draft' | 'published'

export interface News {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  imageUrl: string
  category: NewsCategory
  authorName: string
  isFeatured: boolean
  isPublished: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}
