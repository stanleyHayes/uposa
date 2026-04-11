export type EventStatus = 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED'

export interface Event {
  id: string
  title: string
  slug: string
  description: string
  imageUrl: string
  date: string
  endDate: string
  location: string
  rsvpLink: string
  status: EventStatus
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}
