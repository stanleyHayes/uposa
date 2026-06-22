import type { ElementType } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface StatItem {
  label: string
  value: string | number
  icon: ElementType
  color: string
  bg: string
  border?: string
}

interface PageStatsProps {
  stats: StatItem[]
  className?: string
}

/* ─── Decorative accent shapes per card ────────────────────── */
const accents = [
  'before:absolute before:right-0 before:top-0 before:h-20 before:w-20 before:bg-gradient-to-bl before:from-brand-100/55 before:to-transparent dark:before:from-brand-900/20',
  'before:absolute before:bottom-0 before:left-0 before:h-16 before:w-16 before:bg-gradient-to-tr before:from-cream-500/25 before:to-transparent dark:before:from-amber-900/15',
  'before:absolute before:left-0 before:top-0 before:h-12 before:w-24 before:bg-gradient-to-br before:from-cream-100/80 before:to-transparent dark:before:from-brand-950/20',
  'before:absolute before:bottom-0 before:right-0 before:h-14 before:w-14 before:bg-gradient-to-tl before:from-emerald-100/30 before:to-transparent dark:before:from-emerald-900/15',
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } },
}

export default function PageStats({ stats, className }: PageStatsProps) {
  return (
    <motion.div
      className={cn('mb-7 grid grid-cols-2 gap-4 sm:grid-cols-4', className)}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            variants={item}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={cn(
              'admin-card-surface relative overflow-hidden p-4 transition-shadow duration-300',
              stat.border ?? 'border-gray-200/80 dark:border-dark-border',
              accents[i % accents.length]
            )}
          >
            <div className="relative z-10 flex items-start gap-3">
              <motion.div
                className={cn(
                  stat.bg,
                  'shrink-0 border border-brand-950/10 p-2.5 shadow-sm dark:!border-white/10 dark:!bg-white/[0.07] dark:shadow-black/20',
                )}
                whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
              >
                <Icon size={20} className={cn(stat.color, 'dark:!text-cream-200')} />
              </motion.div>
              <div className="min-w-0">
                <p className="text-2xl font-black leading-tight tracking-tight text-brand-950 dark:text-gray-100">{stat.value}</p>
                <p className="mt-0.5 text-xs font-semibold leading-tight text-brand-950/50 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cream-500/60 to-transparent dark:via-brand-600/25" />
          </motion.div>
        )
      })}
    </motion.div>
  )
}
