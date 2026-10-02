#!/usr/bin/env node
/**
 * Build-time prerender for the marketing site (runs after `vite build` and the
 * SSR build of src/entry-server.tsx).
 *
 * For every public route it writes a static HTML file containing the fully
 * rendered page, that page's own <title>/meta/canonical/JSON-LD, and the API
 * data it was rendered with (so the client hydrates without refetching first).
 * It also writes 404.html, an SPA shell (_app.html) for news/project slugs
 * published after the build, and sitemap.xml.
 *
 * If the API is unreachable the build still succeeds: static routes get
 * per-page head tags over the client-rendered shell, and the sitemap lists the
 * static routes only.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(appRoot, 'dist');
const ssrEntry = path.join(appRoot, 'dist-ssr', 'entry-server.js');

const env = { ...loadEnv('production', appRoot, 'VITE_'), ...process.env };
const API_BASE = (env.VITE_API_URL || '').replace(/\/+$/, '');

const { render, STATIC_ROUTES, SITE_URL, absoluteUrl, PRERENDER_DATA_ID } = await import(pathToFileURL(ssrEntry).href);

// Page component behind each route, for <link rel="modulepreload"> hints.
const PAGE_SOURCES = {
    '/': 'Home', '/about': 'About', '/our-school': 'OurSchool', '/membership': 'Membership', '/news': 'News',
    '/events': 'Events', '/projects': 'Projects', '/community': 'Community', '/donate': 'Donate', '/contact': 'Contact',
};
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,150}$/i;

const log = (...args) => console.log('[prerender]', ...args);

// ── API ────────────────────────────────────────────────────────────────────

async function fetchJson(pathname, { timeoutMs = 20000, attempts = 2 } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const res = await fetch(`${API_BASE}${pathname}`, { signal: AbortSignal.timeout(timeoutMs) });
            if (res.status === 404) return null;
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            return json.data ?? null;
        } catch (error) {
            lastError = error;
        }
    }
    throw new Error(`${pathname}: ${lastError?.message || lastError}`);
}

async function mapLimit(items, limit, fn) {
    const results = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index]);
        }
    });
    await Promise.all(workers);
    return results;
}

async function loadContent() {
    if (!/^https:\/\//.test(API_BASE)) {
        log(`VITE_API_URL is "${API_BASE || '(unset)'}" — skipping data fetch, writing head-only pages.`);
        return null;
    }
    try {
        // Render free instances cold-start in ~30-60s; give the first call room.
        const siteData = await fetchJson('/public/site-data', { timeoutMs: 90000, attempts: 3 });
        if (!siteData) throw new Error('empty site-data');
        const [news, projects, events] = await Promise.all([
            fetchJson('/news?limit=100'),
            fetchJson('/projects?limit=100'),
            fetchJson('/events?limit=100'),
        ]);
        const validSlugs = (list) => (Array.isArray(list) ? list : []).map((item) => item.slug).filter((slug) => SLUG_PATTERN.test(slug || ''));
        const [articles, projectDetails] = await Promise.all([
            mapLimit(validSlugs(news), 4, (slug) => fetchJson(`/news/${slug}`).catch(() => null)),
            mapLimit(validSlugs(projects), 4, (slug) => fetchJson(`/projects/${slug}`).catch(() => null)),
        ]);
        return {
            siteData,
            news: Array.isArray(news) ? news : [],
            projects: Array.isArray(projects) ? projects : [],
            events: Array.isArray(events) ? events : [],
            articles: articles.filter((item) => item && SLUG_PATTERN.test(item.slug)),
            projectDetails: projectDetails.filter((item) => item && SLUG_PATTERN.test(item.slug)),
        };
    } catch (error) {
        log(`API unavailable (${error.message}) — writing head-only pages.`);
        return null;
    }
}

// ── HTML assembly ──────────────────────────────────────────────────────────

const escapeAttr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escapeText = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// React 19 emits hoisted <title>/<meta>/<link> tags ahead of the body markup.
function splitHoisted(html) {
    const match = html.match(/^(?:\s*(?:<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*>))+/);
    const head = match ? match[0] : '';
    // Mark them so the client can drop any React re-inserts after a hydration fallback (main.tsx).
    return { head: head.replace(/<(title|meta|link)\b/g, '<$1 data-ssr'), body: html.slice(head.length) };
}

function modulePreloads(manifest, sourceName) {
    if (!manifest || !sourceName) return '';
    const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);
    const entryFile = entryKey && manifest[entryKey].file;
    const files = new Set();
    const visit = (key) => {
        const chunk = manifest[key];
        if (!chunk || files.has(chunk.file) || chunk.file === entryFile) return;
        files.add(chunk.file);
        (chunk.imports || []).forEach(visit);
    };
    visit(`src/pages/${sourceName}.tsx`);
    return [...files].map((file) => `<link rel="modulepreload" crossorigin href="/${file}">`).join('');
}

function stripDefaultHead(template) {
    return template.replace(/^[ \t]*<[^>]*\bdata-seo-default\b[^>]*>(?:[^<]*<\/title>)?\s*\n/gm, '');
}

function buildPage(template, { headTags, body, payload, preloads }) {
    let html = stripDefaultHead(template).replace('</head>', `${headTags}${preloads}</head>`);
    if (body !== undefined) {
        const json = JSON.stringify(payload).replace(/</g, '\\u003c');
        html = html.replace(
            /<div id="root">[\s\S]*?<!--app-html:end-->\s*<\/div>/,
            () => `<div id="root" data-prerendered="true">${body}</div><script id="${PRERENDER_DATA_ID}" type="application/json">${json}</script>`,
        );
    }
    return html;
}

/** Head tags for a route when the API was unavailable (client renders the body). */
function fallbackHead(route) {
    // Same rule as <SEO>: append the brand only when the title doesn't name it.
    const title = /\bUPOSA\b/.test(route.title) ? route.title : `${route.title} | UPOSA`;
    const url = absoluteUrl(route.path);
    const image = `${SITE_URL}/og-image.png`;
    return [
        `<title data-seo-default>${escapeText(title)}</title>`,
        `<meta data-seo-default name="description" content="${escapeAttr(route.description)}">`,
        `<link data-seo-default rel="canonical" href="${url}">`,
        `<meta data-seo-default property="og:type" content="website">`,
        `<meta data-seo-default property="og:url" content="${url}">`,
        `<meta data-seo-default property="og:title" content="${escapeAttr(title)}">`,
        `<meta data-seo-default property="og:description" content="${escapeAttr(route.description)}">`,
        `<meta data-seo-default property="og:image" content="${image}">`,
        `<meta data-seo-default name="twitter:card" content="summary_large_image">`,
    ].join('');
}

async function writeRoute(routePath, html) {
    const file = routePath === '/' ? 'index.html' : `${routePath.replace(/^\//, '')}.html`;
    const target = path.join(distDir, file);
    if (!target.startsWith(distDir + path.sep)) throw new Error(`Refusing to write outside dist: ${routePath}`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
}

// ── Sitemap ────────────────────────────────────────────────────────────────

function sitemapXml(entries) {
    const urls = entries.map(({ loc, lastmod, changefreq, priority, image }) => [
        '  <url>',
        `    <loc>${escapeText(loc)}</loc>`,
        lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '',
        changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
        priority !== undefined ? `    <priority>${priority.toFixed(1)}</priority>` : '',
        image ? `    <image:image><image:loc>${escapeText(image)}</image:loc></image:image>` : '',
        '  </url>',
    ].filter(Boolean).join('\n'));
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
}

function latest(...dates) {
    const times = dates.flat().map((value) => Date.parse(value)).filter((time) => !Number.isNaN(time));
    return times.length ? new Date(Math.max(...times)).toISOString() : undefined;
}
const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//.test(value);

// ── Main ───────────────────────────────────────────────────────────────────

const template = await readFile(path.join(distDir, 'index.html'), 'utf8');
if (!template.includes('<!--app-html:end-->')) throw new Error('index.html is missing the <!--app-html:end--> marker');

const manifestPath = path.join(distDir, '.vite', 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => 'null'));
const apiOrigin = /^https:\/\//.test(API_BASE) ? new URL(API_BASE).origin : null;
const preconnect = apiOrigin ? `<link rel="preconnect" href="${apiOrigin}" crossorigin>` : '';

// The SPA shell keeps the generic head tags; main.tsx removes them before render.
await writeFile(path.join(distDir, '_app.html'), template.replace('</head>', `${preconnect}</head>`));

const content = await loadContent();
// One timestamp for the whole build: time-relative UI hydrates against it (useNow).
const renderedAt = Date.now();
const staticRoutes = Object.values(STATIC_ROUTES);
const sitemap = [];

if (!content) {
    for (const route of staticRoutes) {
        await writeRoute(route.path, buildPage(template, { headTags: fallbackHead(route), preloads: preconnect + modulePreloads(manifest, PAGE_SOURCES[route.path]) }));
        sitemap.push({ loc: absoluteUrl(route.path), changefreq: route.changefreq, priority: route.priority });
    }
} else {
    const { siteData, news, projects, events, articles, projectDetails } = content;
    const pageData = { '/news': { news }, '/projects': { projects }, '/events': { events } };
    const newsDates = news.map((item) => item.updatedAt || item.publishedAt);
    const projectDates = projects.map((item) => item.updatedAt);
    const routeLastmod = { '/': latest(newsDates, projectDates), '/news': latest(newsDates), '/projects': latest(projectDates) };

    const jobs = [
        ...staticRoutes.map((route) => ({
            path: route.path,
            pages: pageData[route.path] || {},
            source: PAGE_SOURCES[route.path],
            sitemap: { changefreq: route.changefreq, priority: route.priority, lastmod: routeLastmod[route.path] },
        })),
        ...articles.map((article) => ({
            path: `/news/${article.slug}`,
            pages: { [`news/${article.slug}`]: article },
            source: 'NewsDetail',
            sitemap: { changefreq: 'monthly', priority: 0.7, lastmod: article.updatedAt || article.publishedAt, image: isHttpUrl(article.imageUrl) && article.imageUrl },
        })),
        ...projectDetails.map((project) => ({
            path: `/projects/${project.slug}`,
            pages: { [`projects/${project.slug}`]: project },
            source: 'ProjectDetail',
            sitemap: { changefreq: 'weekly', priority: 0.7, lastmod: project.updatedAt, image: isHttpUrl(project.imageUrl) && project.imageUrl },
        })),
    ];

    for (const job of jobs) {
        const payload = { siteData, pages: job.pages, renderedAt };
        const { head, body } = splitHoisted(await render(job.path, payload));
        if (!head.includes('rel="canonical"')) throw new Error(`${job.path} rendered without a canonical tag`);
        await writeRoute(job.path, buildPage(template, { headTags: head, body, payload, preloads: preconnect + modulePreloads(manifest, job.source) }));
        sitemap.push({ loc: absoluteUrl(job.path), ...job.sitemap });
    }

    const notFound = splitHoisted(await render('/404', { siteData, pages: {}, renderedAt }));
    await writeFile(path.join(distDir, '404.html'), buildPage(template, {
        headTags: notFound.head,
        body: notFound.body,
        payload: { siteData, pages: {}, renderedAt },
        preloads: preconnect + modulePreloads(manifest, 'NotFoundPage'),
    }));
    log(`rendered ${jobs.length} routes (${articles.length} articles, ${projectDetails.length} projects) + 404`);
}

await writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml(sitemap));
await rm(path.join(distDir, '.vite'), { recursive: true, force: true });
log(`sitemap.xml: ${sitemap.length} URLs on ${SITE_URL}`);
