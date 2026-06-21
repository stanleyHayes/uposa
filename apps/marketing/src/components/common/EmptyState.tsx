import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`relative flex min-h-[260px] w-full flex-col items-center justify-center overflow-hidden border border-base-300 bg-base-100 px-6 py-12 text-center shadow-sm ${className}`}
    >
      <span aria-hidden="true" className="absolute left-4 top-4 h-5 w-5 border-l-2 border-t-2 border-primary/10" />
      <span aria-hidden="true" className="absolute right-4 top-4 h-5 w-5 border-r-2 border-t-2 border-primary/10" />
      <span aria-hidden="true" className="absolute bottom-4 left-4 h-5 w-5 border-b-2 border-l-2 border-primary/10" />
      <span aria-hidden="true" className="absolute bottom-4 right-4 h-5 w-5 border-b-2 border-r-2 border-primary/10" />

      <motion.div
        className="relative mb-7 flex h-24 w-24 items-center justify-center text-primary/30 [&_svg]:h-14 [&_svg]:w-14 [&_svg]:stroke-[1.6]"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span aria-hidden="true" className="absolute inset-0 rounded-full border border-dashed border-primary/10" />
        <span aria-hidden="true" className="absolute inset-5 rounded-full border border-secondary/15" />
        {icon}
      </motion.div>

      <h3 className="relative z-10 text-xl font-bold text-primary md:text-2xl">{title}</h3>
      <p className="relative z-10 mt-3 max-w-xl text-base leading-relaxed text-base-content/55">{description}</p>

      {action && <div className="relative z-10 mt-7">{action}</div>}
    </motion.div>
  );
}
