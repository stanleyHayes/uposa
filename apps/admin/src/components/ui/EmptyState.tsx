import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/* ─── Animated floating doodle shapes ──────────────────────── */
function Doodle({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={cn('absolute pointer-events-none', className)}
      animate={{ y: [0, -10, 0], rotate: [0, 6, -6, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 5, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

/* ─── Sparkle SVG ──────────────────────────────────────────── */
function Sparkle({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('absolute w-4 h-4 pointer-events-none', className)}
      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41Z" />
    </motion.svg>
  )
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('relative flex flex-col items-center justify-center py-16 px-4 text-center min-h-[320px] overflow-hidden', className)}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-100/30 dark:bg-brand-900/20 rounded-full blur-3xl" />
      </div>

      {/* Floating doodles */}
      <Doodle className="top-4 left-[28%] w-10 h-10 rounded-full border-[3px] border-brand-200 dark:border-brand-700 opacity-40" delay={0} />
      <Doodle className="top-8 right-[28%] w-6 h-6 border-[3px] border-amber-300/40 dark:border-amber-600/30 rotate-45 opacity-40" delay={0.8} />
      <Doodle className="bottom-8 left-[32%] w-5 h-5 bg-brand-200/40 dark:bg-brand-700/30 rounded-md opacity-40" delay={1.5} />
      <Doodle className="bottom-12 right-[30%] w-8 h-8 rounded-full border-[3px] border-dashed border-brand-300/30 dark:border-brand-600/20 opacity-40" delay={0.4} />

      {/* Sparkles */}
      <Sparkle className="top-10 left-[38%] text-amber-400/50 dark:text-amber-500/30" delay={0} />
      <Sparkle className="bottom-14 right-[35%] text-brand-400/40 dark:text-brand-500/25" delay={1.2} />
      <Sparkle className="top-1/3 right-[28%] text-brand-300/35 dark:text-brand-600/20" delay={2} />

      {/* Animated icon container */}
      {icon && (
        <motion.div
          className="relative z-10 mb-5"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <motion.div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 via-brand-100/80 to-brand-50 dark:from-dark-hover dark:via-dark-card dark:to-dark-hover flex items-center justify-center shadow-lg shadow-brand-200/30 dark:shadow-brand-900/20 border border-brand-200/50 dark:border-brand-800/30"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="text-brand-500 dark:text-brand-400"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              {icon}
            </motion.div>
          </motion.div>
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-brand-300/40 dark:border-brand-600/20"
            animate={{ scale: [1, 1.2, 1.2], opacity: [0.6, 0, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
          />
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        className="relative z-10 text-base font-bold text-gray-900 dark:text-gray-100 mb-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          className="relative z-10 text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {description}
        </motion.p>
      )}

      {/* Action */}
      {action && (
        <motion.div
          className="relative z-10 mt-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  )
}
