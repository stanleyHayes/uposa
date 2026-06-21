import { Header } from "./Header.tsx";
import { Footer } from "./Footer.tsx";
import * as React from "react";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { PageTransition } from "../common/PageTransition.tsx";

interface LayoutProps {
    children: React.ReactNode;
}

const SiteWatermarks = () => (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
        <div
            className="absolute inset-0 opacity-[0.018]"
            style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, var(--uposa-watermark-grid) 1px, transparent 0)",
                backgroundSize: "64px 64px",
            }}
        />
        <img
            src="/logo.png"
            alt=""
            className="absolute -right-32 top-24 h-[420px] w-[420px] object-contain opacity-[0.028] md:h-[560px] md:w-[560px]"
        />
        <img
            src="/logo.png"
            alt=""
            className="absolute -left-28 bottom-8 h-[320px] w-[320px] object-contain opacity-[0.022] md:h-[460px] md:w-[460px]"
        />
    </div>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { hash, pathname } = useLocation();

    useEffect(() => {
        if (hash) {
            setTimeout(() => {
                const el = document.querySelector(hash);
                if (el) el.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } else {
            window.scrollTo(0, 0);
        }
    }, [hash, pathname]);

    return (
        <PageTransition>
            <div className="min-h-screen flex flex-col">
                <SiteWatermarks />
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
        </PageTransition>
    );
};
