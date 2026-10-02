import type { ReactNode } from "react";
import { Layout } from "../layout/Layout.tsx";
import { HeroReveal } from "./HeroReveal.tsx";

export interface LegalSection {
    id: string;
    title: string;
    body: ReactNode;
}

interface LegalPageProps {
    eyebrow: string;
    title: string;
    intro: ReactNode;
    updated: string;
    sections: LegalSection[];
    /** <SEO /> for the page; rendered inside the layout. */
    seo: ReactNode;
}

/** Shared layout for the Privacy Policy, Terms of Use and account deletion pages. */
export function LegalPage({ eyebrow, title, intro, updated, sections, seo }: LegalPageProps) {
    return (
        <Layout>
            {seo}
            <section className="relative overflow-hidden bg-base-100 text-primary">
                <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
                <div className="relative mx-auto max-w-4xl px-4 py-14 md:py-20">
                    <HeroReveal>
                        <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">{eyebrow}</p>
                        <h1 className="text-4xl font-bold leading-tight md:text-6xl">{title}</h1>
                        <div className="mt-6 max-w-3xl text-lg leading-relaxed text-base-content/70">{intro}</div>
                        <p className="mt-6 text-sm font-semibold text-base-content/50">Last updated: {updated}</p>
                    </HeroReveal>
                </div>
            </section>

            <section className="bg-base-200 py-12 md:py-16">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[240px_1fr]">
                    <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-secondary">On this page</p>
                        <ol className="space-y-2 text-sm">
                            {sections.map((section, index) => (
                                <li key={section.id}>
                                    <a href={`#${section.id}`} className="text-base-content/70 hover:text-primary">
                                        {index + 1}. {section.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>

                    <article className="legal-prose space-y-10 border border-primary/10 bg-base-100 p-6 text-base leading-relaxed text-base-content/80 md:p-10">
                        {sections.map((section, index) => (
                            <section key={section.id} id={section.id} className="scroll-mt-28">
                                <h2 className="mb-4 text-2xl font-bold text-primary">
                                    {index + 1}. {section.title}
                                </h2>
                                <div className="space-y-4 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
                                    {section.body}
                                </div>
                            </section>
                        ))}
                    </article>
                </div>
            </section>
        </Layout>
    );
}
