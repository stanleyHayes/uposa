import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function CustomSelect({ options, value, onChange, placeholder = 'Select...', className = '' }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const allOptions = placeholder ? [{ value: '', label: placeholder }, ...options] : options
  const selected = allOptions.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Scroll highlighted into view
  useEffect(() => {
    if (!open || highlighted < 0 || !listRef.current) return
    const items = listRef.current.children
    if (items[highlighted]) (items[highlighted] as HTMLElement).scrollIntoView({ block: 'nearest' })
  }, [highlighted, open])

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open && highlighted >= 0) handleSelect(allOptions[highlighted].value)
        else { setOpen(true); setHighlighted(allOptions.findIndex(o => o.value === value)) }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!open) { setOpen(true); setHighlighted(allOptions.findIndex(o => o.value === value)) }
        else setHighlighted(i => Math.min(i + 1, allOptions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (open) setHighlighted(i => Math.max(i - 1, 0))
        break
      case 'Escape':
        setOpen(false)
        break
    }
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-between w-full h-10 px-3.5 rounded-xl border text-sm transition-all duration-150 ${
          open
            ? 'border-primary ring-2 ring-primary/15 bg-base-100'
            : 'border-base-300 bg-base-100 hover:border-base-content/20'
        }`}
      >
        <span className={`truncate ${!selected || selected.value === '' ? 'text-base-content/40' : 'text-base-content font-medium'}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-base-content/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-base-100 border border-base-300 rounded-xl shadow-xl shadow-black/8 py-1 max-h-60 overflow-y-auto"
          style={{ animation: 'fadeInUp 0.15s ease-out' }}
        >
          {allOptions.map((opt, i) => {
            const isSelected = opt.value === value
            const isHighlighted = i === highlighted
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 text-sm transition-colors ${
                  isHighlighted ? 'bg-primary/8' : ''
                } ${isSelected && !isHighlighted ? 'bg-primary/5' : ''} ${
                  isSelected ? 'text-primary font-medium' : 'text-base-content/70'
                } hover:bg-primary/8`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={14} className="shrink-0 text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
