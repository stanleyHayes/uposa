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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-100 overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      {/* Floating doodles */}
      <FloatingDoodle className="top-[15%] left-[18%] w-10 h-10 rounded-full border-[3px] border-primary/10" delay={0} />
      <FloatingDoodle className="top-[22%] right-[20%] w-6 h-6 border-[3px] border-secondary/15 rotate-45" delay={0.5} />
      <FloatingDoodle className="bottom-[20%] left-[22%] w-5 h-5 bg-primary/8 rounded-md" delay={1} />
      <FloatingDoodle className="bottom-[25%] right-[18%] w-8 h-8 rounded-full border-[3px] border-dashed border-accent/10" delay={0.3} />
      <FloatingDoodle className="top-[40%] left-[12%] w-4 h-4 bg-secondary/10 rounded-full" delay={1.5} />
      <FloatingDoodle className="top-[35%] right-[12%] w-7 h-2 bg-primary/8 rounded-full" delay={0.8} />
      <FloatingDoodle className="bottom-[35%] left-[35%] w-3 h-3 bg-accent/8 rounded-full" delay={2} />
      <FloatingDoodle className="top-[60%] right-[30%] w-6 h-6 border-[2px] border-primary/8 rounded-lg rotate-12" delay={1.2} />

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
          className="absolute w-3.5 h-3.5 text-secondary/30 pointer-events-none"
          style={{ left: spark.x, top: spark.y }}
          animate={{ scale: [0, 1, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: spark.delay, ease: 'easeInOut' }}
        >
          <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41Z" />
        </motion.svg>
      ))}

      {/* Animated doodle SVG ring */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute w-[280px] h-[280px] pointer-events-none opacity-[0.06]"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="8 12" className="text-primary" />
        <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.8" fill="none" strokeDasharray="4 8" className="text-secondary" />
      </motion.svg>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo / brand mark */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/25">
            <span className="text-2xl font-black text-primary-content tracking-tight">U</span>
          </div>
        </motion.div>

        {/* Brand name */}
        <motion.h1
          className="mt-5 text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary/60 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          UPOSA Alumni
        </motion.h1>

        <motion.p
          className="mt-1 text-sm text-base-content/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          Loading your portal...
        </motion.p>

        {/* Animated loading bar */}
        <motion.div
          className="mt-6 w-48 h-1 rounded-full bg-base-300 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  )
}
