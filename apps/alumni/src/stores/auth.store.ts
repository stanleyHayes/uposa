import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Member } from '../types'

interface AuthState {
  token: string | null
  user: Member | null
  isAuthenticated: boolean
  setAuth: (token: string, user: Member) => void
  updateUser: (user: Partial<Member>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        localStorage.setItem('uposa_alumni_token', token)
        set({ token, user, isAuthenticated: true })
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      logout: () => {
        localStorage.removeItem('uposa_alumni_token')
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    { name: 'uposa_alumni_auth' }
  )
)
