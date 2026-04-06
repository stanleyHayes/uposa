import { cn } from '../../utils/cn'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className }: Props) {
  const sizes = { sm: 'loading-sm', md: 'loading-md', lg: 'loading-lg' }
  return <span className={cn('loading loading-spinner text-primary', sizes[size], className)} />
}
