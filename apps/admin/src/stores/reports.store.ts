import { create } from 'zustand'
import { adminReportsApi } from '../api/services'

interface ReportsState {
  /** Open (unresolved) reports, for the sidebar badge and dashboard queue. */
  openCount: number
  setOpenCount: (count: number) => void
  fetchOpenCount: () => Promise<void>
}

export const useReportsStore = create<ReportsState>((set) => ({
  openCount: 0,
  setOpenCount: (count) => set({ openCount: count }),
  fetchOpenCount: async () => {
    try {
      const res = await adminReportsApi.list({ status: 'OPEN', limit: 1 })
      const p = res.data.pagination
      set({ openCount: p?.openCount ?? p?.total ?? 0 })
    } catch {
      // Background poll: the Reports page surfaces real errors.
    }
  },
}))
