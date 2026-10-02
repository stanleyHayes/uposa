import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser } from '../types'
import {
  ADMIN_REFRESH_TOKEN_KEY,
  ADMIN_TOKEN_KEY,
  clearAdminSession,
  onAdminAccessRefreshed,
  refreshAdminSession,
  type AdminAccess,
} from '../api/client'

interface AuthState {
  currentUser: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateCurrentUser: (updates: Partial<AdminUser>) => void
  /** Re-read the admin (and their current permissions) from /auth/me. */
  fetchMe: () => Promise<void>
  /** Apply permissions/role returned by the API (login, refresh, /auth/me). */
  applyAccess: (access: AdminAccess) => void
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface ApiAdminPayload {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

/** Login, /auth/admin/refresh and /auth/me return `permissions` and `roleInfo` beside the admin object. */
function toCurrentUser(admin: ApiAdminPayload, access: AdminAccess | undefined): AdminUser {
  return {
    id: admin.id,
    name: admin.fullName,
    email: admin.email,
    password: '',
    roleInfo: access?.roleInfo ?? { key: admin.role, name: admin.role },
    permissions: access?.permissions ?? [],
    createdAt: admin.createdAt,
    isActive: admin.isActive,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await fetch(`${API_BASE}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const data = await res.json()

          if (!res.ok || !data.success) {
            set({ isLoading: false })
            return { success: false, error: data.message || 'Invalid email or password.' }
          }

          const { token, refreshToken, admin } = data.data
          localStorage.setItem(ADMIN_TOKEN_KEY, token)
          if (refreshToken) localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken)

          const adminUser = { ...toCurrentUser(admin, data.data), lastLoginAt: new Date().toISOString() }
          set({ currentUser: adminUser, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch {
          set({ isLoading: false })
          return { success: false, error: 'Network error. Please try again.' }
        }
      },
      logout: () => {
        clearAdminSession()
        fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {})
        set({ currentUser: null, isAuthenticated: false })
      },
      updateCurrentUser: (updates) =>
        set((s) => ({
          currentUser: s.currentUser ? { ...s.currentUser, ...updates } : null,
        })),
      applyAccess: (access) =>
        set((s) => ({
          currentUser: s.currentUser
            ? {
                ...s.currentUser,
                ...(access.permissions ? { permissions: access.permissions } : {}),
                ...(access.roleInfo ? { roleInfo: access.roleInfo } : {}),
              }
            : null,
        })),
      fetchMe: async () => {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY)
        if (!token) return

        try {
          const getMe = (accessToken: string) =>
            fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } })
          let res = await getMe(token)
          // The 15-minute access token has usually expired by the next visit; renew it first.
          if (res.status === 401) {
            const renewed = await refreshAdminSession()
            if (renewed) res = await getMe(renewed)
          }
          const data = await res.json()

          if (!res.ok || !data.success) {
            clearAdminSession()
            set({ currentUser: null, isAuthenticated: false })
            return
          }

          const admin = data.data?.data as ApiAdminPayload | undefined
          if (admin && data.data?.type === 'admin') {
            set((s) => ({
              currentUser: { ...toCurrentUser(admin, data.data), lastLoginAt: s.currentUser?.lastLoginAt },
              isAuthenticated: true,
            }))
          }
        } catch {
          // Network hiccup: keep the current session; the next poll retries.
        }
      },
    }),
    { name: 'uposa_auth' }
  )
)

onAdminAccessRefreshed((access) => useAuthStore.getState().applyAccess(access))
