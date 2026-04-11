export * from './auth.types'
export * from './alumni.types'
export * from './event.types'
export * from './news.types'
export * from './project.types'
export * from './donation.types'
export * from './aboutContent.types'
export * from './executive.types'
export * from './job.types'
export * from './election.types'
export * from './poll.types'
export * from './forum.types'
export * from './announcement.types'
export * from './contactMessage.types'
export * from './gallery.types'
export * from './schoolLeader.types'

export interface ActivityLogEntry {
  id: string
  action: string
  targetType: string
  targetId: string
  performedBy: string
  performedByName: string
  timestamp: string
}
