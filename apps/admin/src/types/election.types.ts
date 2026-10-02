export type ElectionStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface ElectionCandidate {
  id: string
  name: string
  memberId?: string
  bio?: string
  photoUrl?: string
  votes: number
  /** Only on the results response, e.g. "42.86". */
  percentage?: string
}

export interface Election {
  id: string
  title: string
  description?: string | null
  position: string
  candidates: ElectionCandidate[]
  status: ElectionStatus
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  /** Only on the results response. */
  totalVotes?: number
}
