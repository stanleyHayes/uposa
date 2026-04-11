export interface GalleryItem {
  id: string
  title: string
  caption?: string
  description?: string
  imageUrl: string
  category?: string
  categoryId?: string
  createdById: string
  createdAt: string
}

export interface GalleryCategory {
  id: string
  name: string
  description?: string
  coverImageUrl?: string
  imageCount?: number
  order: number
  createdAt: string
  updatedAt: string
}
