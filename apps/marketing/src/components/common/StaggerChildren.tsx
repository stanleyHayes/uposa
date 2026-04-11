import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import * as React from "react";

interface StaggerChildrenProps {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
    duration?: number;
    once?: boolean;
}

export const StaggerChildren: React.FC<StaggerChildrenProps> = ({
    children,
    className,
    staggerDelay = 0.1,
    duration = 0.4,
    once = true,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, margin: "-40px 0px" });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: staggerDelay } },
            }}
        >
            {React.Children.map(children, (child) => (
                <motion.div
                    className="h-full"
                    variants={{
                        hidden: { opacity: 0, y: 24, scale: 0.97 },
                        visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    transition={{ duration, ease: "easeOut" }}
                >
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
};
