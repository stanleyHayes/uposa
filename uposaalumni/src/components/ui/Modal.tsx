import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function Modal({ open, onClose, title, children, className }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  return (
    <dialog ref={dialogRef} className={`modal ${className || ''}`} onClose={onClose}>
      <div className="modal-box">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{title}</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}
