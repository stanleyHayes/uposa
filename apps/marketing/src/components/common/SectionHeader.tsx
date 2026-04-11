import { ScrollReveal } from './ScrollReveal.tsx';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  align?: 'left' | 'center';
}

export default function SectionHeader({ icon: Icon, title, description, align = 'center' }: SectionHeaderProps) {
  return (
    <ScrollReveal>
      <div className={`mb-12 ${align === 'center' ? 'text-center' : ''}`}>
        <motion.div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/10 text-secondary mb-4 ${align === 'center' ? 'mx-auto' : ''}`}
          animate={{ y: [0, -4, 0], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon size={22} />
        </motion.div>
        <h2 className="text-3xl font-bold mb-3">{title}</h2>
        <p className={`text-base-content/60 max-w-xl ${align === 'center' ? 'mx-auto' : ''}`}>{description}</p>
      </div>
    </ScrollReveal>
  );
}
