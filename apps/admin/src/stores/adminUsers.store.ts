import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser, Role } from '../types'
import { MOCK_ADMIN_USERS } from '../constants/mock-data/users.mock'

interface AdminUsersState {
  users: AdminUser[]
  addUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => AdminUser
  updateUser: (id: string, updates: Partial<AdminUser>) => void
  deleteUser: (id: string) => void
  deactivateUser: (id: string) => void
  activateUser: (id: string) => void
  assignRole: (id: string, role: Role) => void
  updateLastLogin: (id: string) => void
  resetToDefaults: () => void
}

export const useAdminUsersStore = create<AdminUsersState>()(
  persist(
    (set) => ({
      users: MOCK_ADMIN_USERS,
      addUser: (user) => {
        const newUser: AdminUser = {
          ...user,
          id: `user-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ users: [...s.users, newUser] }))
        return newUser
      },
      updateUser: (id, updates) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)) })),
      deleteUser: (id) =>
        set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
      deactivateUser: (id) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, isActive: false } : u)) })),
      activateUser: (id) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, isActive: true } : u)) })),
      assignRole: (id, role) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, role } : u)) })),
      updateLastLogin: (id) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, lastLoginAt: new Date().toISOString() } : u
          ),
        })),
      resetToDefaults: () => set({ users: MOCK_ADMIN_USERS }),
    }),
    { name: 'uposa_admin_users', version: 2 }
  )
)
