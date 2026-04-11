import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
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
