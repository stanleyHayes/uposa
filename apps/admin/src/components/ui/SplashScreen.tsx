import { motion } from 'framer-motion'

/* ─── Animated doodles for splash ──────────────────────────── */
function FloatingDoodle({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
      transition={{ opacity: { duration: 0.5, delay }, y: { duration: 4, repeat: Infinity, delay, ease: 'easeInOut' }, rotate: { duration: 5, repeat: Infinity, delay, ease: 'easeInOut' } }}
    />
  )
}

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-100/30 dark:bg-brand-900/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-100/20 dark:bg-amber-900/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      {/* Floating doodles */}
      <FloatingDoodle className="top-[15%] left-[18%] w-10 h-10 rounded-full border-[3px] border-brand-200/40 dark:border-brand-700/25" delay={0} />
      <FloatingDoodle className="top-[22%] right-[20%] w-6 h-6 border-[3px] border-amber-300/30 dark:border-amber-600/20 rotate-45" delay={0.5} />
      <FloatingDoodle className="bottom-[20%] left-[22%] w-5 h-5 bg-brand-200/30 dark:bg-brand-700/20 rounded-md" delay={1} />
      <FloatingDoodle className="bottom-[25%] right-[18%] w-8 h-8 rounded-full border-[3px] border-dashed border-brand-300/25 dark:border-brand-600/15" delay={0.3} />
      <FloatingDoodle className="top-[40%] left-[12%] w-4 h-4 bg-amber-200/25 dark:bg-amber-700/15 rounded-full" delay={1.5} />
      <FloatingDoodle className="top-[35%] right-[12%] w-7 h-2 bg-brand-200/20 dark:bg-brand-700/15 rounded-full" delay={0.8} />
      <FloatingDoodle className="bottom-[35%] left-[35%] w-3 h-3 bg-brand-300/20 dark:bg-brand-600/15 rounded-full" delay={2} />
      <FloatingDoodle className="top-[60%] right-[30%] w-6 h-6 border-[2px] border-brand-200/20 dark:border-brand-700/15 rounded-lg rotate-12" delay={1.2} />

      {/* Sparkles */}
      {[
        { x: '25%', y: '30%', delay: 0 },
        { x: '70%', y: '25%', delay: 0.8 },
        { x: '20%', y: '65%', delay: 1.6 },
        { x: '75%', y: '70%', delay: 2.2 },
      ].map((spark, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="absolute w-3.5 h-3.5 text-amber-400/30 dark:text-amber-500/20 pointer-events-none"
          style={{ left: spark.x, top: spark.y }}
          animate={{ scale: [0, 1, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: spark.delay, ease: 'easeInOut' }}
        >
          <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41Z" />
        </motion.svg>
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo / brand mark */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 flex items-center justify-center shadow-2xl shadow-brand-900/30">
            <span className="text-2xl font-black text-cream-100 tracking-tight">U</span>
          </div>
        </motion.div>

        {/* Brand name */}
        <motion.h1
          className="mt-5 text-2xl font-bold bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 dark:from-brand-200 dark:via-brand-400 dark:to-brand-300 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          UPOSA Admin
        </motion.h1>

        <motion.p
          className="mt-1 text-sm text-gray-400 dark:text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          Loading your workspace...
        </motion.p>

        {/* Animated loading bar */}
        <motion.div
          className="mt-6 w-48 h-1 rounded-full bg-gray-200 dark:bg-dark-hover overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  )
}
