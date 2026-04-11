import { cn } from '../../utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200/70 dark:bg-dark-hover',
        variant === 'text' && 'rounded-md h-4',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-xl',
        className
      )}
      style={{ width, height }}
    />
  )
}

/** Skeleton row for data tables — mimics a typical table row with cells */
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-gray-50 dark:border-dark-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Skeleton className={i === 0 ? 'w-40 h-4 mb-1.5' : 'w-24 h-4'} />
          {i === 0 && <Skeleton className="w-56 h-3 mt-1" />}
        </td>
      ))}
    </tr>
  )
}

interface TableSkeletonProps {
  cols?: number
  rows?: number
  className?: string
}

/** Full table skeleton with header + rows */
export function TableSkeleton({ cols = 5, rows = 6, className }: TableSkeletonProps) {
  return (
    <div className={cn('bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-dark-hover dark:to-dark-hover/50 border-b-2 border-gray-100 dark:border-dark-border px-5 py-3.5 flex gap-8">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {/* Rows */}
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Stat cards skeleton — mimics PageStats */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200/80 dark:border-dark-border shadow-[0_1px_4px_rgba(0,27,80,0.05)] p-4 flex items-start gap-3"
        >
          <Skeleton variant="rectangular" className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1">
            <Skeleton className="w-12 h-6 mb-1.5" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Card grid skeleton — mimics grid card layouts */
export function CardGridSkeleton({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div className={cn(
      'grid gap-4',
      cols === 2 && 'grid-cols-1 sm:grid-cols-2',
      cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      cols === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <Skeleton variant="circular" className="w-12 h-12 shrink-0" />
            <div className="flex-1">
              <Skeleton className="w-28 h-4 mb-1.5" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
          <Skeleton className="w-full h-3 mb-2" />
          <Skeleton className="w-3/4 h-3" />
        </div>
      ))}
    </div>
  )
}

/** Page-level loading skeleton combining stats + header + table */
export function PageSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="page-enter">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Skeleton className="w-48 h-7 mb-2" />
          <Skeleton className="w-32 h-4" />
        </div>
        <Skeleton variant="rectangular" className="w-32 h-9 rounded-lg" />
      </div>
      <StatsSkeleton />
      <TableSkeleton cols={cols} rows={rows} />
    </div>
  )
}
