import { type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  padding?: boolean
}

export default function Card({ title, action, children, className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        'card-enter admin-card-surface overflow-hidden',
        'transition-all duration-300 ease-out',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-brand-950/10 bg-cream-100/35 px-6 py-4 dark:border-dark-border dark:bg-dark-hover/35">
          {title && (
            <h3 className="border-l-2 border-cream-500 pl-3 text-base font-black text-brand-950 dark:text-gray-100">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn(padding && 'p-6')}>{children}</div>
    </div>
  )
}
