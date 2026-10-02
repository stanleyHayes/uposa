export type EventStatus = 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED'

export interface Event {
  id: string
  title: string
  slug: string
  description: string
  imageUrl?: string | null
  date: string
  endDate?: string | null
  location?: string | null
  rsvpLink?: string | null
  status: EventStatus
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  /** Only on the single-event (by slug) response. */
  _count?: { rsvps: number }
}
