import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Member } from '../types'

const ACCESS_TOKEN_KEY = 'uposa_alumni_token'
const REFRESH_TOKEN_KEY = 'uposa_alumni_refresh_token'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: Member | null
  isAuthenticated: boolean
  setAuth: (token: string, refreshToken: string | null, user: Member) => void
  updateUser: (user: Partial<Member>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, refreshToken, user) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, token)
        if (refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
        } else {
          localStorage.removeItem(REFRESH_TOKEN_KEY)
        }
        set({ token, refreshToken: refreshToken ?? null, user, isAuthenticated: true })
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      logout: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false })
      },
    }),
    { name: 'uposa_alumni_auth' }
  )
)
