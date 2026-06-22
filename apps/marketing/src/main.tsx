import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
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
import {HelmetProvider} from "react-helmet-async";
import {SiteDataProvider} from "./context/SiteDataContext.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <HelmetProvider>
            <BrowserRouter>
                <SiteDataProvider>
                    <App/>
                </SiteDataProvider>
            </BrowserRouter>
        </HelmetProvider>
    </StrictMode>,
)
