import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="modal-backdrop-enter fixed inset-0 bg-brand-950/55 backdrop-blur-sm" aria-hidden="true" />
      <div
        className={cn(
          'card-enter admin-card-surface relative flex max-h-[90vh] w-full flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]',
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-brand-950/10 bg-gradient-to-r from-cream-100/80 to-cream-50 px-6 py-4 dark:border-dark-border dark:from-dark-hover/80 dark:to-dark-card">
            <h2 id="modal-title" className="text-lg font-black text-brand-950 dark:text-gray-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-brand-950/35 transition-colors hover:bg-cream-100 hover:text-brand-950 dark:text-gray-400 dark:hover:bg-dark-hover dark:hover:text-gray-200"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-brand-950/10 px-6 py-4 dark:border-dark-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
