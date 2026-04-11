export type ElectionStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface ElectionCandidate {
  id: string
  name: string
  manifesto: string
  photoUrl: string
  votes: number
}

export interface Election {
  id: string
  title: string
  description: string
  position: string
  candidates: ElectionCandidate[]
  status: ElectionStatus
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}
