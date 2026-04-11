import { Header } from "./Header.tsx";
import { Footer } from "./Footer.tsx";
import * as React from "react";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { PageTransition } from "../common/PageTransition.tsx";

interface LayoutProps {
    children: React.ReactNode;
}

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
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
        </PageTransition>
    );
};
