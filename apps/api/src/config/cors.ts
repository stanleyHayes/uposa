import { env } from './env';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://uposa.org',
  'https://www.uposa.org',
  'https://admin.uposa.org',
  'https://alumni.uposa.org',
  'https://uposa-admin.vercel.app',
  'https://uposa-alumni.vercel.app',
];

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function normalizeOrigin(origin: string): string {
  try {
    return new URL(origin).origin;
  } catch {
    return origin.replace(/\/+$/, '');
  }
}

export const corsAllowedOrigins = Array.from(
  new Set(
    [
      env.CLIENT_URL,
      env.ADMIN_URL,
      ...DEFAULT_ALLOWED_ORIGINS,
      ...env.ALLOWED_ORIGINS,
    ]
      .filter(Boolean)
      .map(normalizeOrigin)
  )
);

/**
 * Patterns are anchored to the whole origin: an unanchored `uposa\.org` would
 * otherwise also allow `https://uposa.org.evil.com`.
 */
export function compileOriginPattern(pattern: string): RegExp {
  return new RegExp(`^(?:${pattern})$`);
}

export const corsAllowedOriginPatterns = env.ALLOWED_ORIGIN_PATTERNS.map(compileOriginPattern);

export function isCorsOriginAllowed(origin?: string): boolean {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);

  return (
    corsAllowedOrigins.includes(normalizedOrigin) ||
    corsAllowedOriginPatterns.some((pattern: RegExp) => pattern.test(normalizedOrigin)) ||
    (env.NODE_ENV !== 'production' && LOCAL_ORIGIN_PATTERN.test(normalizedOrigin))
  );
}
