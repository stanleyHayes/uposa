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

if (container.dataset.prerendered === 'true') {
    // scripts/prerender.mjs rendered this route at build time; attach to it.
    hydrateRoot(container, app);
} else {
    // SPA shell (e.g. an article published after the last build): drop the
    // generic head tags so the page's own <SEO> tags are the only ones.
    document.head.querySelectorAll('[data-seo-default]').forEach((el) => el.remove());
    createRoot(container).render(app);
}
