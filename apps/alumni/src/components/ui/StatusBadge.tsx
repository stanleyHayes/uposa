import { cn } from '../../utils/cn'

const variants: Record<string, string> = {
  ACTIVE: 'badge-success',
  PAID: 'badge-success',
  CONFIRMED: 'badge-success',
  ACCEPTED: 'badge-success',
  COMPLETED: 'badge-success',
  APPROVED: 'badge-success',
  ONGOING: 'bg-[#FFF8DC] text-[#001B50] border-[#E8DFC0]',
  UPCOMING: 'bg-[#FFF8DC] text-[#001B50] border-[#E8DFC0]',
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
  status?: string | null
  className?: string
}

export default function StatusBadge({ status, className }: Props) {
  const value = (status ?? '').toString()
  return (
    <span className={cn('badge badge-sm font-status', variants[value] || 'badge-ghost', className)}>
      {value ? value.replace(/_/g, ' ') : '—'}
    </span>
  )
}
