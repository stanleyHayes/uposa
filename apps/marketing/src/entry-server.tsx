/* eslint-disable react-refresh/only-export-components -- server-only build entry; never hot-reloaded */
import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import App from './App.tsx';
import { SiteDataProvider, type PrerenderPayload } from './context/SiteDataContext.tsx';

export { PRERENDER_DATA_ID } from './context/SiteDataContext.tsx';
export { STATIC_ROUTES, SITE_URL, absoluteUrl } from './seo/site.ts';

/**
 * Build-time renderer used by scripts/prerender.mjs. `prerender` waits for
 * every lazy route and Suspense boundary, so the HTML contains the full page.
 * React 19 emits the page's hoisted <title>/<meta>/<link> tags ahead of the
 * body markup; the prerender script moves them into <head>.
 */
export async function render(url: string, payload: PrerenderPayload): Promise<string> {
    const { prelude } = await prerender(
        <StrictMode>
            <StaticRouter location={url}>
                <SiteDataProvider initialPayload={payload}>
                    <App />
                </SiteDataProvider>
            </StaticRouter>
        </StrictMode>,
    );
    return new Response(prelude).text();
}
