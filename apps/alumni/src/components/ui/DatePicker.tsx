import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const triggerCls =
  'input input-bordered h-12 w-full border-primary/10 bg-base-100 px-4 text-base-content shadow-none transition-colors focus:border-primary focus:bg-base-100 focus:outline-none'

function parseValue(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const today = useMemo(() => new Date(), [])
  const [open, setOpen] = useState(false)
  const selected = parseValue(value)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const openPicker = () => {
    const base = selected ?? today
    setViewYear(base.getFullYear())
    setViewMonth(base.getMonth())
    setOpen((prev) => !prev)
  }

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    // Monday-first offset
    const offset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const list: (Date | null)[] = Array.from({ length: offset }, () => null)
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push(new Date(viewYear, viewMonth, day))
    }
    return list
  }, [viewYear, viewMonth])

  const pick = (date: Date) => {
    if (date > today) return
    onChange(toIsoDate(date))
    setOpen(false)
  }

  const navButtonCls = 'grid h-8 w-8 place-items-center text-base-content/60 transition-colors hover:bg-base-200 hover:text-primary'

  return (
    <div ref={rootRef} className="relative w-full">
      <button type="button" onClick={openPicker} className={`${className ?? triggerCls} flex items-center gap-3 text-left`}>
        <Calendar className="h-4 w-4 shrink-0 text-base-content/35" />
        <span className={`min-w-0 flex-1 truncate ${value ? '' : 'text-base-content/35'}`}>
          {value || placeholder}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full z-50 mt-2 w-full min-w-72 overflow-hidden border border-primary/10 bg-base-100 shadow-[0_18px_50px_rgba(0,27,80,0.18)] rounded-[20px_4px_20px_4px] sm:w-80"
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3 text-primary-content">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">{label}</p>
              <p className="mt-1 font-display text-xl leading-tight">
                {selected ? toIsoDate(selected) : 'Select a date'}
              </p>
            </div>

            {/* Year + month navigation */}
            <div className="mt-3 flex items-center justify-between px-3">
              <button type="button" onClick={() => setViewYear((y) => y - 1)} className={navButtonCls} aria-label="Previous year">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="font-display text-base font-bold text-base-content">
                {MONTHS[viewMonth]} {viewYear}
              </p>
              <button type="button" onClick={() => setViewYear((y) => y + 1)} className={navButtonCls} aria-label="Next year">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between px-3">
              <button type="button" onClick={() => shiftMonth(-1)} className={navButtonCls} aria-label="Previous month">
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-base-content/40">month</p>
              <button type="button" onClick={() => shiftMonth(1)} className={navButtonCls} aria-label="Next month">
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday header */}
            <div className="mt-2 grid grid-cols-7 px-3">
              {WEEKDAYS.map((day, index) => (
                <span key={`${day}-${index}`} className="py-1 text-center text-[11px] font-bold tracking-wider text-secondary">
                  {day}
                </span>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5 px-3 pb-2">
              {cells.map((date, index) => {
                if (!date) return <span key={`blank-${index}`} className="h-9" />
                const isSelected = selected ? sameDay(date, selected) : false
                const isToday = sameDay(date, today)
                const isFuture = date > today
                return (
                  <button
                    key={date.getTime()}
                    type="button"
                    onClick={() => pick(date)}
                    disabled={isFuture}
                    className={`flex h-9 items-center justify-center text-sm transition-colors ${
                      isSelected
                        ? 'bg-secondary font-bold text-secondary-content'
                        : isFuture
                          ? 'cursor-not-allowed text-base-content/25'
                          : `text-base-content hover:bg-base-200 ${isToday ? 'ring-1 ring-inset ring-primary' : ''}`
                    }`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-primary/10 px-4 py-2.5">
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                className="text-sm font-semibold text-base-content/50 transition-colors hover:text-base-content"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewYear(today.getFullYear())
                  setViewMonth(today.getMonth())
                }}
                className="text-sm font-semibold text-secondary transition-colors hover:text-secondary/80"
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
