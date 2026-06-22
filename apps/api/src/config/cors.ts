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

export const corsAllowedOriginPatterns = env.ALLOWED_ORIGIN_PATTERNS.map((pattern: string) => new RegExp(pattern));

export function isCorsOriginAllowed(origin?: string): boolean {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);

  return (
    corsAllowedOrigins.includes(normalizedOrigin) ||
    corsAllowedOriginPatterns.some((pattern: RegExp) => pattern.test(normalizedOrigin)) ||
    (env.NODE_ENV !== 'production' && LOCAL_ORIGIN_PATTERN.test(normalizedOrigin))
  );
}
