import { useState, useEffect } from "react";

type Theme = "light" | "dark";

const THEME_MAP = { light: "uposa-light", dark: "uposa-dark" } as const;

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem("uposa-theme") as Theme | null;
        if (stored) return stored;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", THEME_MAP[theme]);
        localStorage.setItem("uposa-theme", theme);
    }, [theme]);

    const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

    return { theme, toggle };
}
