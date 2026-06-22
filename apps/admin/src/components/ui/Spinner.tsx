import { cn } from '../../utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8',
  md: 'w-12',
  lg: 'w-16',
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  const barClasses = {
    sm: ['h-1.5 w-8', 'h-1.5 w-5'],
    md: ['h-2 w-12', 'h-2 w-8'],
    lg: ['h-2.5 w-16', 'h-2.5 w-10'],
  }

  return (
    <span
      className={cn('inline-grid gap-1 text-current', sizeClasses[size], className)}
      aria-hidden="true"
    >
      <span className={cn('animate-pulse bg-current/25', barClasses[size][0])} />
      <span className={cn('animate-pulse bg-current/15', barClasses[size][1])} />
    </span>
  )
}
