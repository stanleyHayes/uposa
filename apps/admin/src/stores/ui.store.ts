import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface UIState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  darkMode: boolean
  toasts: Toast[]
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
  toggleDarkMode: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const savedDark = localStorage.getItem('uposa_dark_mode') === 'true'
const savedCollapsed = localStorage.getItem('uposa_sidebar_collapsed') === 'true'

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: savedCollapsed,
  mobileSidebarOpen: false,
  darkMode: savedDark,
  toasts: [],
  toggleSidebar: () =>
    set((s) => {
      // On mobile, toggle the mobile drawer
      if (window.innerWidth < 1024) {
        return { mobileSidebarOpen: !s.mobileSidebarOpen }
      }
      // On desktop, toggle collapse
      const next = !s.sidebarCollapsed
      localStorage.setItem('uposa_sidebar_collapsed', String(next))
      return { sidebarCollapsed: next }
    }),
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('uposa_sidebar_collapsed', String(collapsed))
    set({ sidebarCollapsed: collapsed })
  },
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode
      localStorage.setItem('uposa_dark_mode', String(next))
      if (next) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      return { darkMode: next }
    }),
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
