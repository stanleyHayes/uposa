import { forwardRef, useState, useRef, useEffect, type SelectHTMLAttributes } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  options: SelectOption[]
  error?: string
  placeholder?: string
  onChange?: (e: { target: { value: string; name: string } }) => void
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, className, id, value, name, onChange, disabled, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const [open, setOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const allOptions = placeholder ? [{ value: '', label: placeholder }, ...options] : options
    const selectedOption = allOptions.find((o) => o.value === String(value ?? ''))
    const displayLabel = selectedOption?.label ?? placeholder ?? 'Select...'

    // Close on outside click
    useEffect(() => {
      if (!open) return
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [open])

    // Scroll highlighted item into view
    useEffect(() => {
      if (!open || highlightedIndex < 0 || !listRef.current) return
      const items = listRef.current.children
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' })
      }
    }, [highlightedIndex, open])

    const handleSelect = (optValue: string) => {
      onChange?.({ target: { value: optValue, name: name ?? '' } })
      setOpen(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (open && highlightedIndex >= 0) {
            handleSelect(allOptions[highlightedIndex].value)
          } else {
            setOpen(true)
            setHighlightedIndex(allOptions.findIndex((o) => o.value === String(value ?? '')))
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (!open) {
            setOpen(true)
            setHighlightedIndex(allOptions.findIndex((o) => o.value === String(value ?? '')))
          } else {
            setHighlightedIndex((i) => Math.min(i + 1, allOptions.length - 1))
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (open) {
            setHighlightedIndex((i) => Math.max(i - 1, 0))
          }
          break
        case 'Escape':
          setOpen(false)
          break
      }
    }

    return (
      <div className={cn('flex flex-col gap-1 relative', className)} ref={containerRef}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-bold text-brand-950/75 dark:text-gray-300">
            {label}
          </label>
        )}

        {/* Hidden native select for form compatibility */}
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={String(value ?? '')}
          onChange={(e) => onChange?.({ target: { value: e.target.value, name: name ?? '' } })}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          {...props}
        >
          {allOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Custom trigger */}
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex w-full items-center justify-between border px-3 py-2.5 text-left text-sm font-semibold',
            'bg-cream-50/80 text-brand-950 shadow-sm transition-all duration-150 dark:bg-dark-hover',
            'focus:border-brand-700 focus:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:focus:bg-dark-surface',
            'disabled:bg-cream-100/70 disabled:text-brand-950/35 disabled:cursor-not-allowed dark:disabled:bg-dark-card',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
              : open
                ? 'border-brand-700 ring-2 ring-brand-500/15'
                : 'border-brand-950/15 hover:border-brand-950/30 dark:border-gray-600 dark:hover:border-gray-500',
          )}
        >
          <span className={cn(
            'truncate',
            !selectedOption || selectedOption.value === '' ? 'text-brand-950/35 dark:text-gray-500' : 'text-brand-950 dark:text-gray-100'
          )}>
            {displayLabel}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              'shrink-0 text-gray-400 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div
            ref={listRef}
            role="listbox"
            className={cn(
              'absolute z-50 top-full left-0 right-0 mt-1',
              'bg-cream-50 dark:bg-dark-card',
              'border border-brand-950/10 dark:border-dark-border',
              'shadow-lg shadow-brand-950/10 dark:shadow-black/30',
              'py-1 max-h-60 overflow-y-auto',
              'select-dropdown-enter',
            )}
          >
            {allOptions.map((opt, i) => {
              const isSelected = opt.value === String(value ?? '')
              const isHighlighted = i === highlightedIndex

              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2.5 text-sm transition-colors',
                    isHighlighted && 'bg-cream-100 dark:bg-brand-900/20',
                    isSelected && !isHighlighted && 'bg-cream-100/70 dark:bg-dark-hover',
                    !isHighlighted && !isSelected && 'hover:bg-cream-100 dark:hover:bg-dark-hover',
                    isSelected ? 'text-brand-950 dark:text-brand-300 font-bold' : 'text-brand-950/70 dark:text-gray-300',
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={15} className="shrink-0 text-brand-500" />}
                </button>
              )
            })}
          </div>
        )}

        {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
