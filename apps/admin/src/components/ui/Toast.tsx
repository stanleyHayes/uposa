import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { Toast as ToastType } from '../../stores/ui.store'

interface ToastProps {
  toast: ToastType
  onRemove: (id: string) => void
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const styleMap = {
  success: 'admin-card-surface border-green-400 text-green-700',
  error: 'admin-card-surface border-red-400 text-red-700',
  warning: 'admin-card-surface border-yellow-400 text-yellow-700',
  info: 'admin-card-surface border-blue-400 text-blue-700',
}

const iconStyleMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
}

export default function Toast({ toast, onRemove }: ToastProps) {
  const Icon = iconMap[toast.type]
  return (
    <div
      className={cn(
        'flex w-full max-w-sm items-start gap-3 border-l-4 px-4 py-3 shadow-lg',
        styleMap[toast.type]
      )}
      role="alert"
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', iconStyleMap[toast.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{toast.title}</p>
        {toast.message && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors mt-0.5"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}
