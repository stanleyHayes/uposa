import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface Reveal3DProps {
  children: ReactNode;
  className?: string;
  /** Starting X-axis tilt in degrees (how far "back" it leans before settling). */
  tilt?: number;
}

/**
 * Scroll-triggered 3D perspective reveal. As the element scrolls up into view,
 * it rotates from `tilt`° (leaning back in 3D space) to flat while rising,
 * scaling, and fading in — a subtle depth/parallax effect. Honors
 * `prefers-reduced-motion`.
 */
export function Reveal3D({ children, className = "", tilt = 30 }: Reveal3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center 60%"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [tilt, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [110, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.65, 1]);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={className} style={{ perspective: "1200px" }}>
      <motion.div
        style={{
          rotateX,
          y,
          scale,
          opacity,
          transformOrigin: "center 85%",
          transformStyle: "preserve-3d",
          willChange: "transform, opacity",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default Reveal3D;
