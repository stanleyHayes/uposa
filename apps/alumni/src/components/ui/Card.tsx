import { type ReactNode } from 'react'

/* ──────────────────────────────────────────────────────────────
   Custom Card System — replaces DaisyUI card classes with
   polished, brand-aware components (cream theme variant).

   Brand tokens:
     primary  #001B50 (deep navy)
     secondary #D4AF37 (gold)
     accent   #003380 (royal blue)
     base-100 #FFF8DC (cream)
   ────────────────────────────────────────────────────────────── */

type AccentColor = 'primary' | 'secondary' | 'accent'
type CardShape = 'default' | 'notch' | 'slant' | 'ticket' | 'wave' | 'ribbon'

/* ─── Base Card ─────────────────────────────────────────────── */

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  shape?: CardShape
  as?: 'div' | 'article'
}

export function Card({ children, className = '', hover = true, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={[
        'card relative bg-base-100 overflow-hidden',
        hover && 'hover:-translate-y-0.5',
        'transition-all duration-300 ease-out',
        'group/card',
        className,
      ]
        .flat()
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  )
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
  iconBg = 'bg-primary/8',
  title,
  action,
}: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 pt-5">
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
  return <div className={`px-6 py-5 ${className}`}>{children}</div>
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
    <div className={`px-6 pb-5 pt-3 border-t border-base-300/40 ${className}`}>
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

const statAccents = [
  'before:bg-gradient-to-bl before:from-primary/8 before:to-transparent',
  'before:bg-gradient-to-br before:from-secondary/8 before:to-transparent',
  'before:bg-gradient-to-tl before:from-accent/8 before:to-transparent',
  'before:bg-gradient-to-tr before:from-primary/6 before:to-transparent',
]

let statIndex = 0

export function StatCard({ icon, value, label, iconBg = 'bg-primary/8' }: StatCardProps) {
  const accent = statAccents[statIndex++ % statAccents.length]

  return (
    <Card hover={false}>
      <div className={`relative overflow-hidden before:absolute before:top-0 before:right-0 before:w-16 before:h-16 sm:before:w-20 sm:before:h-20 before:rounded-bl-[40px] ${accent}`}>
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3.5 px-3.5 py-3 sm:px-5 sm:py-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 hover:rotate-6 hover:scale-110`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold leading-tight tracking-tight truncate">{value}</p>
            <p className="text-[11px] sm:text-xs text-base-content/50 font-medium mt-0.5">{label}</p>
          </div>
        </div>
        {/* Bottom gradient accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      </div>
    </Card>
  )
}
