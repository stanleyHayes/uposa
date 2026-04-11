import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute pointer-events-none rounded-full ${className}`}
      animate={{
        y: [0, -18, 0],
        x: [0, 6, -6, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

function Sparkle({ cx, cy, delay = 0 }: { cx: number; cy: number; delay?: number }) {
  return (
    <motion.g
      animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <circle cx={cx} cy={cy} r="2" fill="#D4AF37" opacity="0.6" />
      <line x1={cx} y1={cy - 5} x2={cx} y2={cy - 8} stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1={cx} y1={cy + 5} x2={cx} y2={cy + 8} stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1={cx - 5} y1={cy} x2={cx - 8} y2={cy} stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1={cx + 5} y1={cy} x2={cx + 8} y2={cy} stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </motion.g>
  );
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="relative py-16 min-h-[45vh] flex flex-col items-center justify-center text-center overflow-hidden w-full">
      {/* Background gradient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,27,80,0.06) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Floating orbs */}
      <FloatingOrb className="top-[10%] left-[25%] w-3 h-3 bg-secondary/15" delay={0} />
      <FloatingOrb className="top-[20%] right-[25%] w-5 h-5 border-2 border-primary/8" delay={1} />
      <FloatingOrb className="bottom-[15%] left-[30%] w-4 h-4 bg-primary/6" delay={0.5} />
      <FloatingOrb className="bottom-[20%] right-[28%] w-6 h-6 border-2 border-dashed border-secondary/10" delay={1.5} />

      {/* Animated icon container */}
      <motion.div
        className="relative z-10 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      >
        {/* Outer ring */}
        <svg width="140" height="140" viewBox="0 0 140 140" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.circle
            cx="70" cy="70" r="65"
            fill="none"
            stroke="#001B50"
            strokeWidth="1"
            strokeDasharray="12 8"
            opacity="0.08"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '70px 70px' }}
          />
          <Sparkle cx={20} cy={30} delay={0.5} />
          <Sparkle cx={120} cy={25} delay={1.5} />
          <Sparkle cx={15} cy={100} delay={2.5} />
        </svg>

        {/* Icon bubble */}
        <motion.div
          className="relative w-24 h-24 rounded-[28px] bg-gradient-to-br from-base-100 to-base-200 shadow-xl shadow-primary/8 border border-primary/8 flex items-center justify-center"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            className="text-primary/70"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            {icon}
          </motion.div>

          {/* Gold accent dot */}
          <motion.div
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-secondary shadow-sm shadow-secondary/30"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        className="relative z-10 text-xl font-bold mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        className="relative z-10 text-base-content/45 max-w-sm text-sm leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        {description}
      </motion.p>

      {/* Action */}
      {action && (
        <motion.div
          className="relative z-10 mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}
