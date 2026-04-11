import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import * as React from "react";

type Direction = "up" | "down" | "left" | "right";

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    direction?: Direction;
    delay?: number;
    duration?: number;
    once?: boolean;
}

const offsets: Record<Direction, { x: number; y: number }> = {
    up: { x: 0, y: 40 },
    down: { x: 0, y: -40 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
};

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
    children,
    className,
    direction = "up",
    delay = 0,
    duration = 0.5,
    once = true,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, margin: "-60px 0px" });
    const offset = offsets[direction];

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, x: offset.x, y: offset.y }}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: offset.x, y: offset.y }}
            transition={{ duration, delay, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
};
