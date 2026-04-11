export type ProjectStatus = 'ONGOING' | 'COMPLETED' | 'PAUSED'

export interface ProjectMilestone {
  title: string
  description?: string
  date?: string
  completed: boolean
}

export interface Project {
  id: string
  title: string
  slug: string
  description: string
  content?: string
  imageUrl: string
  gallery: string[]
  milestones: ProjectMilestone[]
  goalAmount: number
  raisedAmount: number
  status: ProjectStatus
  isFeatured: boolean
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}
