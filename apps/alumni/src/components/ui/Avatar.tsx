import { cn } from '../../utils/cn'
import { getInitials } from '../../utils/formatters'

interface Props {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

export default function Avatar({ src, name, size = 'md', className }: Props) {
  if (src) {
    return (
      <div className={cn('avatar', className)}>
        <div className={cn('grid place-items-center overflow-hidden rounded-full', sizes[size])}>
          <img src={src} alt={name} className="h-full w-full object-cover" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('avatar placeholder', className)}>
      <div className={cn('grid place-items-center overflow-hidden rounded-full bg-primary text-center text-primary-content', sizes[size])}>
        <span className="block leading-none">{getInitials(name)}</span>
      </div>
    </div>
  )
}
