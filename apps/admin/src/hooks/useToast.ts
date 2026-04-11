import { useMemo } from 'react'
import { useUIStore } from '../stores/ui.store'
import type { ToastType } from '../stores/ui.store'

export function useToast() {
  const { addToast, removeToast } = useUIStore()

  const toast = useMemo(() => ({
    success: (title: string, message?: string) => addToast({ type: 'success' as ToastType, title, message }),
    error: (title: string, message?: string) => addToast({ type: 'error' as ToastType, title, message }),
    warning: (title: string, message?: string) => addToast({ type: 'warning' as ToastType, title, message }),
    info: (title: string, message?: string) => addToast({ type: 'info' as ToastType, title, message }),
  }), [addToast])

  return { toast, removeToast }
}
