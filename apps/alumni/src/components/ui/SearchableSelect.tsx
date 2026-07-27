import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Search } from 'lucide-react'

const triggerCls =
  'select select-bordered h-12 w-full border-primary/10 bg-base-100 text-base-content shadow-none transition-colors focus:border-primary focus:bg-base-100 focus:outline-none'

export default function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = 'Select',
  disabled = false,
  className,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    // Legacy free-text values (stored before the dropdown existed) stay selectable.
    const base = value && !options.includes(value) ? [value, ...options] : options
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter((option) => option.toLowerCase().includes(q))
  }, [options, value, query])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`${className ?? triggerCls} flex items-center justify-between gap-2 px-4 text-left disabled:cursor-not-allowed disabled:opacity-45`}
      >
        <span className={`min-w-0 flex-1 truncate ${value ? '' : 'text-base-content/35'}`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-base-content/35 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden border border-primary/10 bg-base-100 shadow-[0_18px_50px_rgba(0,27,80,0.18)] rounded-[16px_4px_16px_4px]"
          >
            <div className="flex items-center gap-2 border-b border-primary/10 px-3">
              <Search className="h-4 w-4 shrink-0 text-base-content/35" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                className="h-11 w-full bg-transparent text-sm text-base-content outline-none placeholder:text-base-content/35"
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-base-content/45">No matches found.</p>
              )}
              {filtered.map((option) => {
                const active = option === value
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option)
                      close()
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-base-200/70 ${
                      active ? 'bg-base-200/50 font-bold text-base-content' : 'text-base-content/80'
                    }`}
                  >
                    <span className="min-w-0 truncate">{option}</span>
                    {active && <Check className="h-4 w-4 shrink-0 text-secondary" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
