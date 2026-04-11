import { cn } from '../../utils/cn'

type BadgeVariant =
  | 'pending' | 'approved' | 'rejected'
  | 'draft' | 'published' | 'archived'
  | 'active' | 'completed' | 'planning' | 'on_hold' | 'cancelled'
  | 'confirmed' | 'anonymous'
  | 'super_admin' | 'content_manager' | 'membership_manager' | 'moderator'
  // Announcement types
  | 'info' | 'warning' | 'urgent' | 'success'
  // Election status
  | 'upcoming' | 'closed'
  // Job types
  | 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Volunteer'
  // Forum thread status
  | 'open' | 'pinned' | 'deleted'
  // Poll status (reuses active/closed/draft)
  | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  label: string
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-gray-300',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 dark:bg-dark-hover text-gray-600 dark:text-gray-400',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  planning: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
  confirmed: 'bg-green-100 text-green-800',
  anonymous: 'bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-slate-300',
  super_admin: 'bg-purple-100 text-purple-800',
  content_manager: 'bg-blue-100 text-blue-800',
  membership_manager: 'bg-teal-100 text-teal-800',
  moderator: 'bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-gray-300',
  // Announcement types
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800',
  // Election status
  upcoming: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-gray-100 dark:bg-dark-hover text-gray-600 dark:text-gray-400',
  // Job types
  'Full-time': 'bg-blue-100 text-blue-800',
  'Part-time': 'bg-indigo-100 text-indigo-800',
  'Contract': 'bg-orange-100 text-orange-800',
  'Internship': 'bg-teal-100 text-teal-800',
  'Volunteer': 'bg-purple-100 text-purple-800',
  // Forum status
  open: 'bg-green-100 text-green-800',
  pinned: 'bg-brand-100 text-brand-700',
  deleted: 'bg-red-100 text-red-700',
  default: 'bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-gray-300',
}

export default function Badge({ variant = 'default', label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant] ?? variantClasses.default,
        className
      )}
    >
      {label}
    </span>
  )
}
