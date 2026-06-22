import { type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Search...', className, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-950/35 dark:text-gray-500"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-brand-950/15 bg-cream-50/80 py-2.5 pl-9 pr-8 text-sm font-semibold text-brand-950 placeholder:text-brand-950/35 focus:border-brand-700 focus:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-gray-600 dark:bg-dark-hover dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-dark-surface"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-950/35 transition-colors hover:text-brand-950/70 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
