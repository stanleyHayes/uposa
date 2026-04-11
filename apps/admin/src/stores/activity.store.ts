import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActivityLogEntry } from '../types'

interface ActivityState {
  entries: ActivityLogEntry[]
  addActivity: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void
  clearActivity: () => void
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      entries: [],
      addActivity: (entry) => {
        const newEntry: ActivityLogEntry = {
          ...entry,
          id: `act-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
        }
        set((s) => ({ entries: [newEntry, ...s.entries].slice(0, 50) }))
      },
      clearActivity: () => set({ entries: [] }),
    }),
    { name: 'uposa_activity' }
  )
)
