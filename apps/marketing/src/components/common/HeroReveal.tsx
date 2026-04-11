import { motion } from "framer-motion";
import * as React from "react";

interface HeroRevealProps {
    children: React.ReactNode;
    className?: string;
}

export const HeroReveal: React.FC<HeroRevealProps> = ({ children, className }) => {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
};
