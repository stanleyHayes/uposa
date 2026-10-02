export type NewsCategory = 'ANNOUNCEMENT' | 'BLOG' | 'REPORT' | 'MEETING_SUMMARY'
export type NewsStatus = 'draft' | 'published'

export interface News {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  imageUrl: string
  category: NewsCategory
  authorName: string | null
  isFeatured: boolean
  isPublished: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}
