import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * The marketing site prerenders news, projects, events and site content at
 * build time (for SEO). When admins change that content, ask Vercel to rebuild
 * so crawlers see it and the sitemap lists new pages. Debounced so a burst of
 * edits produces one deploy.
 */
const DEBOUNCE_MS = 60_000;
let timer: NodeJS.Timeout | null = null;

export function scheduleMarketingRebuild(reason: string): void {
  const hookUrl = env.MARKETING_DEPLOY_HOOK_URL;
  if (!hookUrl) return;

  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    fetch(hookUrl, { method: 'POST', signal: AbortSignal.timeout(15_000) })
      .then((res) => {
        if (res.ok) logger.info({ reason }, 'Marketing site rebuild triggered');
        else logger.warn({ reason, status: res.status }, 'Marketing deploy hook rejected the rebuild');
      })
      .catch((err: unknown) => logger.warn({ reason, err: (err as Error).message }, 'Marketing deploy hook failed'));
  }, DEBOUNCE_MS);
  timer.unref();
}

/** Mount on admin routes that change public site content. */
export function rebuildMarketingOnWrite(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    res.on('finish', () => {
      if (res.statusCode < 400) scheduleMarketingRebuild(`${req.method} ${req.originalUrl.split("?")[0]}`);
    });
  }
  next();
}
