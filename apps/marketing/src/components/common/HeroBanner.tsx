import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface HeroBannerProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

function Doodle({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

export default function HeroBanner({ icon: Icon, title, description }: HeroBannerProps) {
  return (
    <section className="relative bg-primary text-primary-content py-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#001B50] via-[#002870] to-[#1E3A8A]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      {/* Doodles */}
      <Doodle className="top-6 left-[8%] w-20 h-20 rounded-full border-2 border-white/5" delay={0} />
      <Doodle className="bottom-8 right-[10%] w-14 h-14 border-2 border-white/5 rotate-45" delay={1} />
      <Doodle className="top-1/2 right-[5%] w-8 h-8 bg-secondary/10 rounded-full" delay={0.5} />
      <Doodle className="bottom-4 left-[15%] w-10 h-3 bg-white/5 rounded-full" delay={1.5} />
      <Doodle className="top-10 right-[30%] w-6 h-6 border-2 border-secondary/10 rounded-lg" delay={2} />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-secondary mb-6"
            animate={{ y: [0, -4, 0], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon size={22} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-2xl">{title}</h1>
          <p className="text-lg text-white/65 max-w-xl leading-relaxed">{description}</p>
        </motion.div>
      </div>
    </section>
  );
}
