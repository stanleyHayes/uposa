import {StrictMode} from 'react'
import {createRoot, hydrateRoot} from 'react-dom/client'
import '@fontsource/fraunces/latin-600.css'
import '@fontsource/fraunces/latin-700.css'
import '@fontsource/fraunces/latin-800.css'
import '@fontsource/fraunces/latin-900.css'
import '@fontsource/outfit/latin-400.css'
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import '@fontsource/outfit/latin-700.css'
import '@fontsource/outfit/latin-800.css'
import '@fontsource/outfit/latin-900.css'
import './index.css'
import App from './App.tsx'
import {BrowserRouter} from "react-router";
import {SiteDataProvider} from "./context/SiteDataContext.tsx";

const container = document.getElementById('root')!;

const app = (
    <StrictMode>
        <BrowserRouter>
            <SiteDataProvider>
                <App/>
            </SiteDataProvider>
        </BrowserRouter>
    </StrictMode>
);

/**
 * If hydration ever falls back to a client render (a text mismatch), React adds
 * its own head tags next to the prerendered ones. Drop the prerendered copy of
 * any tag React has re-created so the page keeps one title/description/canonical.
 */
function removeReplacedPrerenderedHeadTags() {
    const keyOf = (el: Element) =>
        el.tagName === 'TITLE' ? 'title' : `${el.tagName}:${el.getAttribute('name') ?? el.getAttribute('property') ?? el.getAttribute('rel')}`;
    const live = new Set([...document.head.querySelectorAll('title, meta, link')].filter((el) => !el.hasAttribute('data-ssr')).map(keyOf));
    document.head.querySelectorAll('[data-ssr]').forEach((el) => {
        if (live.has(keyOf(el))) el.remove();
    });
}

if (container.dataset.prerendered === 'true') {
    // scripts/prerender.mjs rendered this route at build time; attach to it.
    hydrateRoot(container, app, {
        onRecoverableError(error) {
            if (typeof reportError === 'function') reportError(error);
            else console.error(error);
            setTimeout(removeReplacedPrerenderedHeadTags, 0);
        },
    });
} else {
    // SPA shell (e.g. an article published after the last build): drop the
    // generic head tags so the page's own <SEO> tags are the only ones.
    document.head.querySelectorAll('[data-seo-default]').forEach((el) => el.remove());
    createRoot(container).render(app);
}
