import { cn } from '../../utils/cn'

const variants: Record<string, string> = {
  ACTIVE: 'badge-success',
  PAID: 'badge-success',
  CONFIRMED: 'badge-success',
  ACCEPTED: 'badge-success',
  COMPLETED: 'badge-success',
  APPROVED: 'badge-success',
  ONGOING: 'badge-info',
  UPCOMING: 'badge-info',
  PENDING: 'badge-warning',
  OVERDUE: 'badge-error',
  FAILED: 'badge-error',
  SUSPENDED: 'badge-error',
  CANCELLED: 'badge-error',
  DECLINED: 'badge-error',
  REJECTED: 'badge-error',
  INACTIVE: 'badge-ghost',
  CLOSED: 'badge-ghost',
  PAST: 'badge-ghost',
  PAUSED: 'badge-ghost',
}

interface Props {
  status: string
  className?: string
}

export default function StatusBadge({ status, className }: Props) {
  return (
    <span className={cn('badge badge-sm', variants[status] || 'badge-ghost', className)}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
