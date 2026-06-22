import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode, type CSSProperties, type ImgHTMLAttributes } from "react";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /**
   * Vertical drift in pixels across the element's pass through the viewport.
   * Positive = the layer lags (moves slower, "further back"); negative = it
   * leads (moves faster, "closer"). Bigger = more pronounced parallax.
   */
  offset?: number;
}

/**
 * Scroll parallax: translates its content on the Y axis as it scrolls through
 * the viewport, so background and foreground layers move at different rates and
 * fake depth. Honors `prefers-reduced-motion`.
 */
export function Parallax({ children, className = "", style, offset = 120 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  if (reduce) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ ...style, y, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}

/**
 * Drop-in `<img>` replacement that parallax-drifts as it scrolls through the
 * viewport. Keeps whatever positioning/sizing className you pass (e.g. absolute
 * watermark crests) and just adds the Y drift. Honors `prefers-reduced-motion`.
 */
export function ParallaxImg({
  offset = 110,
  style,
  ...props
}: { offset?: number } & ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  if (reduce) {
    return <img ref={ref} style={style} {...props} />;
  }

  // motion.img's prop types differ from raw <img> event handlers; the runtime
  // attrs are valid, so cast the passthrough props.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <motion.img ref={ref} style={{ ...style, y, willChange: "transform" }} {...(props as any)} />;
}

export default Parallax;
