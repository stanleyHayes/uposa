import { create } from 'zustand'
import client from '../api/client'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  /** Fetch latest notifications */
  fetchNotifications: () => Promise<void>
  /** Fetch just the unread count (lightweight poll) */
  fetchUnreadCount: () => Promise<void>
  /** Mark one as read */
  markAsRead: (id: string) => Promise<void>
  /** Mark all as read */
  markAllAsRead: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const res = await client.get('/admin/notifications', { params: { limit: 20 } })
      const data = res.data.data || []
      const unreadCount = data.filter((n: Notification) => !n.isRead).length
      set({ notifications: data, unreadCount, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await client.get('/admin/notifications/unread-count')
      set({ unreadCount: res.data.data?.count ?? 0 })
    } catch {
      // silent
    }
  },

  markAsRead: async (id: string) => {
    try {
      await client.put(`/admin/notifications/${id}/read`)
      set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }))
    } catch {
      // silent
    }
  },

  markAllAsRead: async () => {
    try {
      await client.put('/admin/notifications/read-all')
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }))
    } catch {
      // silent
    }
  },
}))
