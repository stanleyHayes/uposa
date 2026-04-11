import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/* ─── Animated doodle shapes ───────────────────────────────── */
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

export default function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={cn('relative flex flex-col items-center justify-center py-16 text-center overflow-hidden min-h-[320px]', className)}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-secondary/5 rounded-full blur-2xl" />
      </div>

      {/* Floating doodles */}
      <Doodle className="top-4 left-[28%] w-10 h-10 rounded-full border-[3px] border-primary/15 opacity-60" delay={0} />
      <Doodle className="top-8 right-[28%] w-6 h-6 border-[3px] border-secondary/20 rotate-45 opacity-60" delay={0.8} />
      <Doodle className="bottom-8 left-[32%] w-5 h-5 bg-primary/10 rounded-md opacity-60" delay={1.5} />
      <Doodle className="bottom-12 right-[30%] w-8 h-8 rounded-full border-[3px] border-dashed border-accent/15 opacity-60" delay={0.4} />

      {/* Sparkles */}
      <Sparkle className="top-10 left-[38%] text-secondary/40" delay={0} />
      <Sparkle className="bottom-14 right-[35%] text-primary/30" delay={1.2} />
      <Sparkle className="top-1/3 right-[28%] text-secondary/25" delay={2} />

      {/* Animated icon */}
      <motion.div
        className="relative z-10 mb-5"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.div
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/10"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <Icon className="w-10 h-10 text-primary/60" />
          </motion.div>
        </motion.div>
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/20"
          animate={{ scale: [1, 1.2, 1.2], opacity: [0.6, 0, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        className="relative z-10 text-lg font-semibold mb-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          className="relative z-10 text-base-content/60 max-w-md mb-4"
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
          className="relative z-10"
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
