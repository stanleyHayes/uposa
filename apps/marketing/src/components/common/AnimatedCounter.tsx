import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface AnimatedCounterProps {
    value: number;
    suffix?: string;
    className?: string;
    duration?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    suffix = "",
    className,
    duration = 1.5,
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-40px 0px" });
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        const controls = animate(0, value, {
            duration,
            ease: "easeOut",
            onUpdate: (v) => setDisplayValue(Math.round(v)),
        });
        return () => controls.stop();
    }, [isInView, value, duration]);

    return (
        <motion.span
            ref={ref}
            className={className}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            {displayValue.toLocaleString()}{suffix}
        </motion.span>
    );
};
