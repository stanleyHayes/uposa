import { useEffect, useRef, useState } from 'react'
import { Ban, Ellipsis, Flag } from 'lucide-react'
import Modal from '../ui/Modal'
import ReportDialog from './ReportDialog'
import { blocksApi } from '../../api/services'
import { useAuthStore } from '../../stores/auth.store'
import { useToast } from '../../hooks/useToast'
import { BLOCK_EXPLANATION, apiErrorMessage } from '../../lib/moderation'
import type { ReportTargetType } from '../../types'

/**
 * ⋯ menu with "Report" and "Block <name>" for member-generated content
 * (Apple 1.2 / Google Play UGC). Renders nothing on the viewer's own content.
 */
export default function ModerationMenu({
  targetType,
  targetId,
  author,
  canBlock = true,
  onBlocked,
  className = '',
  tone = 'light',
}: {
  targetType: ReportTargetType
  targetId: string
  /** The member behind the content (null for admin-posted content). */
  author?: { id: string; fullName?: string } | null
  canBlock?: boolean
  onBlocked?: (memberId: string) => void
  className?: string
  /** 'dark' for use on the navy hero panels. */
  tone?: 'light' | 'dark'
}) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const toast = useToast()
  const rootRef = useRef<HTMLDivElement>(null)
  // Fixed-position menu so cards with overflow-hidden can't clip it.
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const open = menuPos !== null
  const setOpen = (next: boolean) => {
    if (!next || !rootRef.current) {
      setMenuPos(null)
      return
    }
    const rect = rootRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) })
  }
  const [reporting, setReporting] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [blocking, setBlocking] = useState(false)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    // Keep the fixed menu attached to its button while the page scrolls or resizes.
    const reposition = () => setOpen(true)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open])

  const ownContent = Boolean(author?.id && author.id === currentUserId)
  if (ownContent) return null

  const name = author?.fullName || 'this member'
  const showBlock = canBlock && Boolean(author?.id)

  const block = async () => {
    if (!author?.id) return
    setBlocking(true)
    try {
      await blocksApi.block(author.id)
      toast.success(`${name} is blocked`)
      setConfirmBlock(false)
      onBlocked?.(author.id)
    } catch (err) {
      toast.error(apiErrorMessage(err) || 'Could not block this member. Please try again.')
    } finally {
      setBlocking(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(!open)
        }}
        className={`grid h-9 w-9 place-items-center transition-colors rounded-[12px_3px_12px_3px] ${
          tone === 'dark'
            ? 'text-primary-content/70 hover:bg-primary-content/10 hover:text-primary-content'
            : 'text-base-content/45 hover:bg-base-200 hover:text-base-content'
        }`}
      >
        <Ellipsis className="h-5 w-5" />
      </button>

      {menuPos && (
        <div role="menu" style={{ top: menuPos.top, right: menuPos.right }} className="fixed z-[60] min-w-48 max-w-[calc(100vw-1rem)] overflow-hidden border border-primary/10 bg-base-100 py-1 text-base-content shadow-[0_18px_50px_rgba(0,27,80,0.18)] rounded-[14px_4px_14px_4px]">
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold hover:bg-base-200/70"
            onClick={() => {
              setOpen(false)
              setReporting(true)
            }}
          >
            <Flag className="h-4 w-4" />
            Report
          </button>
          {showBlock && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-error hover:bg-error/8"
              onClick={() => {
                setOpen(false)
                setConfirmBlock(true)
              }}
            >
              <Ban className="h-4 w-4" />
              <span className="truncate">Block {name}</span>
            </button>
          )}
        </div>
      )}

      {reporting && <ReportDialog targetType={targetType} targetId={targetId} onClose={() => setReporting(false)} />}

      {confirmBlock && (
        <Modal open onClose={() => setConfirmBlock(false)} title={`Block ${name}?`}>
          <p className="text-sm leading-relaxed text-base-content/70">{BLOCK_EXPLANATION}</p>
          <p className="mt-2 text-xs text-base-content/50">You can unblock them any time in Settings → Privacy &amp; data.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" className="btn btn-error min-h-11 sm:flex-1" onClick={block} disabled={blocking}>
              {blocking ? 'Blocking…' : `Block ${name}`}
            </button>
            <button type="button" className="btn btn-ghost min-h-11" onClick={() => setConfirmBlock(false)} disabled={blocking}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
