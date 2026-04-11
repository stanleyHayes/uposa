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
  'before:absolute before:top-0 before:right-0 before:w-20 before:h-20 before:bg-gradient-to-bl before:from-brand-100/40 before:to-transparent before:rounded-bl-[40px] dark:before:from-brand-900/20',
  'before:absolute before:bottom-0 before:left-0 before:w-16 before:h-16 before:bg-gradient-to-tr before:from-amber-100/40 before:to-transparent before:rounded-tr-[32px] dark:before:from-amber-900/15',
  'before:absolute before:top-0 before:left-0 before:w-24 before:h-12 before:bg-gradient-to-br before:from-brand-50/50 before:to-transparent before:rounded-br-[24px] dark:before:from-brand-950/20',
  'before:absolute before:bottom-0 before:right-0 before:w-14 before:h-14 before:bg-gradient-to-tl before:from-emerald-100/30 before:to-transparent before:rounded-tl-[28px] dark:before:from-emerald-900/15',
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
      className={cn('grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6', className)}
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
              'relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border shadow-[0_1px_4px_rgba(0,27,80,0.05)] hover:shadow-[0_8px_30px_rgba(0,27,80,0.07)] transition-shadow duration-300 p-4',
              stat.border ?? 'border-gray-200/80 dark:border-dark-border',
              accents[i % accents.length]
            )}
          >
            <div className="relative z-10 flex items-start gap-3">
              <motion.div
                className={cn('rounded-xl p-2.5 shrink-0 shadow-sm', stat.bg, 'dark:bg-dark-hover')}
                whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
              >
                <Icon size={20} className={stat.color} />
              </motion.div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight font-medium">{stat.label}</p>
              </div>
            </div>
            {/* Decorative bottom gradient line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-300/30 to-transparent dark:via-brand-600/20" />
          </motion.div>
        )
      })}
    </motion.div>
  )
}
