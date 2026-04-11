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
        'card-enter bg-white dark:bg-dark-card rounded-2xl overflow-hidden',
        'border border-gray-200/80 dark:border-dark-border',
        'shadow-[0_1px_4px_rgba(0,27,80,0.05),0_0_1px_rgba(0,27,80,0.06)]',
        'hover:shadow-[0_12px_42px_rgba(0,27,80,0.07),0_2px_6px_rgba(0,27,80,0.04)]',
        'transition-all duration-300 ease-out',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/80 dark:border-dark-border">
          {title && (
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 pl-3 border-l-2 border-brand-500">
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
