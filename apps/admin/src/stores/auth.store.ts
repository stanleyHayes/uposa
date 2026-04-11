import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser, ApiAdminRole } from '../types'
import { API_ROLE_MAP } from '../types/auth.types'

interface AuthState {
  currentUser: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateCurrentUser: (updates: Partial<AdminUser>) => void
  fetchMe: () => Promise<void>
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

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

          const { token, admin } = data.data
          localStorage.setItem('uposa_admin_token', token)

          const frontendRole = API_ROLE_MAP[admin.role as ApiAdminRole] || 'moderator'

          const adminUser: AdminUser = {
            id: admin.id,
            name: admin.fullName,
            email: admin.email,
            password: '',
            role: frontendRole,
            apiRole: admin.role,
            createdAt: admin.createdAt,
            lastLoginAt: new Date().toISOString(),
            isActive: admin.isActive,
          }

          set({ currentUser: adminUser, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch {
          set({ isLoading: false })
          return { success: false, error: 'Network error. Please try again.' }
        }
      },
      logout: () => {
        localStorage.removeItem('uposa_admin_token')
        fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {})
        set({ currentUser: null, isAuthenticated: false })
      },
      updateCurrentUser: (updates) =>
        set((s) => ({
          currentUser: s.currentUser ? { ...s.currentUser, ...updates } : null,
        })),
      fetchMe: async () => {
        const token = localStorage.getItem('uposa_admin_token')
        if (!token) return

        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const data = await res.json()

          if (!res.ok || !data.success) {
            localStorage.removeItem('uposa_admin_token')
            set({ currentUser: null, isAuthenticated: false })
            return
          }

          const admin = data.data?.data
          if (admin && data.data?.type === 'admin') {
            const frontendRole = API_ROLE_MAP[admin.role as ApiAdminRole] || 'moderator'
            set({
              currentUser: {
                id: admin.id,
                name: admin.fullName,
                email: admin.email,
                password: '',
                role: frontendRole,
                apiRole: admin.role,
                createdAt: admin.createdAt,
                isActive: admin.isActive,
              },
              isAuthenticated: true,
            })
          }
        } catch {
          // Silently fail - user will need to login again
        }
      },
    }),
    { name: 'uposa_auth' }
  )
)
