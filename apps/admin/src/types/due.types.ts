export type DueStatus = 'PENDING' | 'PAID' | 'OVERDUE'

/** Due as returned by /dues/admin (member attached server-side). */
export interface Due {
  id: string
  memberId: string
  amount: number
  year: number
  status: DueStatus
  transactionRef?: string | null
  paidAt?: string | null
  notes?: string | null
  member?: { id: string; fullName: string; email?: string; yearGroup?: number | null } | null
  createdAt: string
  updatedAt: string
}
