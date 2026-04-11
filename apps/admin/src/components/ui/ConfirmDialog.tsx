import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  /** 'danger' shows red styling, 'warning' shows amber */
  variant?: 'danger' | 'warning'
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger'

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </>
    }>
      <div className="flex items-start gap-4">
        <div className={`shrink-0 rounded-xl p-3 ${
          isDanger
            ? 'bg-red-50 dark:bg-red-900/20'
            : 'bg-amber-50 dark:bg-amber-900/20'
        }`}>
          <AlertTriangle
            size={22}
            className={isDanger
              ? 'text-red-500 dark:text-red-400'
              : 'text-amber-500 dark:text-amber-400'
            }
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{message}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">This action cannot be undone.</p>
        </div>
      </div>
    </Modal>
  )
}
