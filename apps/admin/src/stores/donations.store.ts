import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Donation } from '../types'
import { MOCK_DONATIONS } from '../constants/mock-data/donations.mock'

interface DonationsState {
  donations: Donation[]
  addDonation: (donation: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>) => Donation
  updateDonation: (id: string, updates: Partial<Donation>) => void
  deleteDonation: (id: string) => void
  resetToDefaults: () => void
}

export const useDonationsStore = create<DonationsState>()(
  persist(
    (set) => ({
      donations: MOCK_DONATIONS,
      addDonation: (donation) => {
        const newDonation: Donation = {
          ...donation,
          id: `don-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ donations: [newDonation, ...s.donations] }))
        return newDonation
      },
      updateDonation: (id, updates) =>
        set((s) => ({
          donations: s.donations.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        })),
      deleteDonation: (id) =>
        set((s) => ({ donations: s.donations.filter((d) => d.id !== id) })),
      resetToDefaults: () => set({ donations: MOCK_DONATIONS }),
    }),
    { name: 'uposa_donations', version: 2 }
  )
)
