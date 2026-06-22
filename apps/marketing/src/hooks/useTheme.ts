import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

const THEME_MAP = { light: "uposa-light", dark: "uposa-dark" } as const;

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute("data-theme", THEME_MAP[theme]);
    localStorage.setItem("uposa-theme", theme);
}

/**
 * Animate the theme switch as a circular reveal expanding from the click point,
 * using the View Transitions API. Falls back to an instant switch when the API
 * is unavailable or the user prefers reduced motion.
 */
function runThemeTransition(next: Theme, commit: () => void, event?: { clientX: number; clientY: number }) {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canAnimate = typeof document !== "undefined" && "startViewTransition" in document;

    if (!canAnimate || reduce) {
        commit();
        applyTheme(next);
        return;
    }

    const x = event?.clientX ?? window.innerWidth - 48;
    const y = event?.clientY ?? 48;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = (document as Document & {
        startViewTransition: (cb: () => void) => { ready: Promise<void> };
    }).startViewTransition(() => {
        flushSync(commit);
        applyTheme(next);
    });

    transition.ready.then(() => {
        document.documentElement.animate(
            {
                clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
            },
            { duration: 480, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
        );
    });
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === "undefined") return "light";

        const stored = localStorage.getItem("uposa-theme") as Theme | null;
        if (stored === "light" || stored === "dark") return stored;

        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const toggle = useCallback(
        (event?: { clientX: number; clientY: number }) => {
            const next: Theme = theme === "light" ? "dark" : "light";
            runThemeTransition(next, () => setTheme(next), event);
        },
        [theme],
    );

    return { theme, toggle };
}
