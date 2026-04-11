export type PollStatus = 'ACTIVE' | 'CLOSED'

export interface PollOption {
  id: number
  text: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  description: string
  options: PollOption[]
  allowMultiple: boolean
  status: PollStatus
  endsAt: string
  totalVotes: number
  createdAt: string
  updatedAt: string
}
