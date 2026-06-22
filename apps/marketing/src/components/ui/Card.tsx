import { type ReactNode } from 'react'

/* ──────────────────────────────────────────────────────────────
   Custom Card System — replaces DaisyUI card classes with
   polished, brand-aware components.

   Brand tokens:
     primary  #001B50 (deep navy)
     secondary #D4AF37 (gold)
     accent   #1E3A8A (royal blue)
   ────────────────────────────────────────────────────────────── */

type AccentColor = 'primary' | 'secondary' | 'accent'
type CardShape = 'default' | 'notch' | 'slant' | 'ticket' | 'wave' | 'ribbon'

/* ─── Clip-path presets ─────────────────────────────────────── */

const clipPaths: Record<Exclude<CardShape, 'default'>, string> = {
  /* chamfered top-right corner */
  notch: 'polygon(0 0, calc(100% - 36px) 0, 100% 36px, 100% 100%, 0 100%)',
  /* angled bottom edge */
  slant: 'polygon(0 0, 100% 0, 100% calc(100% - 32px), 0 100%)',
  /* side notches like an event ticket */
  ticket: 'polygon(0 0, 100% 0, 100% calc(50% - 20px), calc(100% - 10px) calc(50% - 10px), calc(100% - 12px) 50%, calc(100% - 10px) calc(50% + 10px), 100% calc(50% + 20px), 100% 100%, 0 100%, 0 calc(50% + 20px), 10px calc(50% + 10px), 12px 50%, 10px calc(50% - 10px), 0 calc(50% - 20px))',
  /* wavy bottom edge */
  wave: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), 90% calc(100% - 6px), 80% calc(100% - 2px), 70% calc(100% - 4px), 60% calc(100% - 10px), 50% calc(100% - 18px), 40% calc(100% - 22px), 30% calc(100% - 20px), 20% calc(100% - 14px), 10% calc(100% - 8px), 0 calc(100% - 10px))',
  /* pointed bottom like a bookmark */
  ribbon: 'polygon(0 0, 100% 0, 100% calc(100% - 24px), 50% 100%, 0 calc(100% - 24px))',
}

/* ─── Base Card ─────────────────────────────────────────────── */

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  shape?: CardShape
  as?: 'div' | 'article'
}

export function Card({ children, className = '', hover = true, shape = 'default', as: Tag = 'div' }: CardProps) {
  const hasShape = shape !== 'default'

  const inner = (
    <Tag
      className={[
        'card relative bg-base-100 overflow-hidden',
        !hasShape && 'border border-base-300/50',
        !hasShape && 'shadow-[0_1px_4px_rgba(0,27,80,0.05),0_0_1px_rgba(0,27,80,0.08)]',
        hover && !hasShape && [
          'hover:shadow-[0_12px_42px_rgba(0,27,80,0.09),0_2px_6px_rgba(0,27,80,0.04)]',
          'hover:-translate-y-0.5 hover:border-primary/15',
        ],
        'transition-all duration-300 ease-out',
        !hasShape && 'group/card',
        !hasShape && className,
      ]
        .flat()
        .filter(Boolean)
        .join(' ')}
      style={hasShape ? { clipPath: clipPaths[shape] } : undefined}
    >
      {children}
    </Tag>
  )

  if (hasShape) {
    return (
      <div
        className={[
          'group/card',
          'drop-shadow-[0_2px_6px_rgba(0,27,80,0.08)]',
          hover && 'hover:drop-shadow-[0_12px_30px_rgba(0,27,80,0.12)] hover:-translate-y-0.5',
          'transition-all duration-300 ease-out',
          className,
        ]
          .flat()
          .filter(Boolean)
          .join(' ')}
      >
        {inner}
      </div>
    )
  }

  return inner
}

/* ─── Accent Strip ──────────────────────────────────────────── */

const accentGradients: Record<AccentColor, string> = {
  primary: 'from-primary via-accent/80 to-primary/50',
  secondary: 'from-secondary via-secondary/70 to-secondary/40',
  accent: 'from-accent via-primary/80 to-accent/50',
}

export function CardAccent({ color = 'primary' }: { color?: AccentColor }) {
  return <div className={`card-accent-strip h-1 bg-gradient-to-r ${accentGradients[color]}`} />
}

/* ─── Header ────────────────────────────────────────────────── */

interface CardHeaderProps {
  icon?: ReactNode
  iconBg?: string
  title: string
  action?: ReactNode
}

export function CardHeader({
  icon,
  iconBg = 'bg-secondary/10',
  title,
  action,
}: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
          >
            {icon}
          </div>
        )}
        <h3 className="font-bold text-base leading-tight">{title}</h3>
      </div>
      {action}
    </div>
  )
}

/* ─── Body ──────────────────────────────────────────────────── */

export function CardBody({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`px-4 py-4 sm:px-6 sm:py-5 ${className}`}>{children}</div>
}

/* ─── Footer ────────────────────────────────────────────────── */

export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`border-t border-base-300/40 px-4 pb-4 pt-3 sm:px-6 sm:pb-5 ${className}`}>
      {children}
    </div>
  )
}

/* ─── Image ─────────────────────────────────────────────────── */

export function CardImage({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <div className="overflow-hidden">
      <img
        src={src}
        alt={alt}
        className={`w-full h-48 object-cover group-hover/card:scale-[1.03] transition-transform duration-500 ease-out ${className}`}
      />
    </div>
  )
}

/* ─── Stat Card ─────────────────────────────────────────────── */

interface StatCardProps {
  icon: ReactNode
  value: ReactNode
  label: string
  iconBg?: string
}

export function StatCard({ icon, value, label, iconBg = 'bg-secondary/10' }: StatCardProps) {
  return (
    <Card hover={false} className="flex items-center gap-3.5 px-5 py-4">
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-base-content/50 font-medium mt-0.5">{label}</p>
      </div>
    </Card>
  )
}
