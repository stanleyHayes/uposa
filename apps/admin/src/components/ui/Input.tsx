import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-bold text-brand-950/75 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full border bg-cream-50/80 px-3 py-2.5 text-sm font-semibold text-brand-950 shadow-sm placeholder:text-brand-950/35 dark:bg-dark-hover dark:text-gray-100 dark:placeholder:text-gray-500',
            'focus:border-brand-700 focus:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:focus:bg-dark-surface',
            'disabled:bg-cream-100/70 disabled:text-brand-950/35 disabled:cursor-not-allowed dark:disabled:bg-dark-card',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
              : 'border-brand-950/15 dark:border-gray-600',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {!error && helperText && <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
