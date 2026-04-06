import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-primary/60" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-base-content/60 max-w-md mb-4">{description}</p>}
      {action}
    </div>
  )
}
