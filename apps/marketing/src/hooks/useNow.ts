import { useSyncExternalStore } from "react";
import { useSiteData } from "../context/SiteDataContext.tsx";

// Captured once per page load so every component agrees on "now".
const loadedAt = Date.now();
const subscribe = () => () => {};

/**
 * Current time for time-relative UI (upcoming vs past, countdowns). While
 * hydrating a prerendered page it returns the build's timestamp so the first
 * client render matches the static HTML; right after, it switches to the real
 * time and React re-renders whatever changed.
 */
export function useNow(): number {
    const { renderedAt } = useSiteData();
    return useSyncExternalStore(subscribe, () => loadedAt, () => renderedAt ?? loadedAt);
}
