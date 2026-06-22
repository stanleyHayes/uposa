import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import Spinner from './Spinner'

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white shadow-md shadow-brand-900/20 hover:shadow-lg hover:shadow-brand-900/25 focus-visible:outline-brand-600 disabled:from-brand-300 disabled:via-brand-300 disabled:to-brand-300 disabled:shadow-none',
  accent:
    'bg-cream-300 text-brand-950 border border-cream-400 shadow-md shadow-brand-950/10 hover:bg-cream-400 hover:shadow-lg hover:shadow-brand-950/15 focus-visible:outline-cream-400 disabled:bg-cream-100 disabled:text-brand-950/40 disabled:border-cream-200 disabled:shadow-none',
  secondary:
    'bg-white dark:bg-dark-hover text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-hover focus-visible:outline-gray-400 disabled:bg-gray-100 dark:disabled:bg-dark-hover disabled:text-gray-400',
  danger:
    'bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/25 focus-visible:outline-red-600 disabled:from-red-300 disabled:via-red-300 disabled:to-red-300 disabled:shadow-none',
  ghost:
    'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover focus-visible:outline-gray-400 disabled:text-gray-300',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed active:scale-[0.97]',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
