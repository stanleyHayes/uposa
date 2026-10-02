/**
 * Dates render the same at build time (prerender, UTC servers) and in every
 * visitor's browser: a fixed locale and Ghana time. Without this, diaspora
 * visitors' local timezone produced different text during hydration, React
 * discarded the prerendered HTML, and head tags were duplicated.
 */
export const SITE_LOCALE = 'en-US';
export const SITE_TIME_ZONE = 'Africa/Accra';

export function formatDate(value: string | number | Date, options: Intl.DateTimeFormatOptions = {}): string {
    return new Date(value).toLocaleDateString(SITE_LOCALE, { timeZone: SITE_TIME_ZONE, ...options });
}

/** Day of the month in Ghana time (Date#getDate uses the visitor's timezone). */
export function dayOfMonth(value: string | number | Date): number {
    return Number(formatDate(value, { day: 'numeric' }));
}
