import { useUIStore } from '../../stores/ui.store'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const alertClasses = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
  warning: 'alert-warning',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="toast toast-end toast-top z-50">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`alert ${alertClasses[toast.type]} shadow-lg`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{toast.message}</span>
              <button className="btn btn-ghost btn-xs" onClick={() => removeToast(toast.id)}>
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
