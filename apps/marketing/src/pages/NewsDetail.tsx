import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Clock,
    Megaphone,
    Newspaper,
    Share2,
    Tag,
    User,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import MarkdownContent from "../components/common/MarkdownContent.tsx";
import { SkeletonBlock, SkeletonLines } from "../components/common/Skeleton.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

type NewsDetailItem = {
    title: string;
    slug?: string;
    content?: string | null;
    excerpt?: string | null;
    imageUrl?: string | null;
    category: string;
    authorName?: string | null;
    publishedAt?: string | null;
};

type NewsDetailResponse = {
    data?: NewsDetailItem | null;
};

function formatCategory(category?: string | null) {
    if (!category) return "Association update";
    return category
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(date?: string | null) {
    if (!date) return "Recent";
    return new Date(date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function getSummary(item: NewsDetailItem) {
    if (item.excerpt) return item.excerpt;
    const content = item.content || "";
    return content.length > 180 ? `${content.substring(0, 180)}...` : content || "Full update available in the article.";
}

function getReadTime(content?: string | null) {
    const wordCount = (content || "").trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(wordCount / 220))} min read`;
}

function ShareButton({ title, className = "" }: { title: string; className?: string }) {
    return (
        <button
            type="button"
            className={`btn ${className}`}
            onClick={() => {
                if (navigator.share) {
                    navigator.share({ title, url: window.location.href });
                    return;
                }

                navigator.clipboard?.writeText(window.location.href);
            }}
        >
            <Share2 size={16} />
            Share
        </button>
    );
}

function NewsHeroImage({ src, title }: { src?: string | null; title: string }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className="relative grid min-h-[300px] place-items-center overflow-hidden border border-primary/15 bg-primary p-8 text-primary-content md:min-h-[440px]">
                <div
                    className="absolute inset-0 opacity-[0.1]"
                    style={{
                        backgroundImage: "linear-gradient(90deg, #fff 1px, transparent 1px), linear-gradient(#fff 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
                <img src="/logo.png" alt="" aria-hidden="true" className="absolute -right-16 -top-16 h-72 w-72 object-contain opacity-[0.08]" />
                <div className="relative text-center">
                    <Newspaper size={42} className="mx-auto mb-4 text-secondary" />
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-content/55">UPOSA news desk</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden border border-primary/15 bg-primary">
            <img
                src={src}
                alt={title}
                className="h-[300px] w-full object-cover md:h-[440px]"
                onError={() => setFailed(true)}
            />
        </div>
    );
}

function NewsDetailSkeleton() {
    return (
        <Layout>
            <SEO title="Loading Article" canonicalPath="/news" />
            <section className="relative overflow-hidden bg-base-100">
                <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:py-24 lg:grid-cols-[1fr_360px] lg:items-end">
                    <div>
                        <SkeletonBlock className="mb-8 h-10 w-44 bg-primary/10" />
                        <SkeletonBlock className="h-12 w-full max-w-3xl bg-primary/15 md:h-20" />
                        <SkeletonBlock className="mt-4 h-12 w-3/4 bg-primary/10" />
                        <SkeletonLines count={2} className="mt-8 max-w-2xl text-primary" />
                    </div>
                    <div className="border border-primary/10 bg-base-200 p-5">
                        <SkeletonBlock className="h-5 w-32 bg-primary/15" />
                        <SkeletonBlock className="mt-6 h-16 w-full bg-primary/10" />
                        <SkeletonBlock className="mt-4 h-16 w-full bg-primary/10" />
                    </div>
                </div>
            </section>
            <section className="bg-base-200 py-12 md:py-16">
                <div className="mx-auto max-w-7xl px-4">
                    <SkeletonBlock className="h-[360px] w-full bg-primary/10" />
                    <div className="mt-8 border border-primary/10 bg-base-100 p-6 md:p-10">
                        <SkeletonLines count={8} className="text-primary" />
                    </div>
                </div>
            </section>
        </Layout>
    );
}

const NewsDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const { data } = useSiteData();
    const [item, setItem] = useState<NewsDetailItem | null>(null);
    const [loading, setLoading] = useState(true);

    const fallbackItem = useMemo(
        () => data?.latestNews.find((article) => article.slug === slug) || null,
        [data, slug],
    );

    useEffect(() => {
        if (!slug) return;

        let cancelled = false;
        setLoading(true);

        fetch(`${API_BASE}/news/${slug}`)
            .then((response) => response.json() as Promise<NewsDetailResponse>)
            .then((json) => {
                if (!cancelled) setItem(json.data || fallbackItem);
            })
            .catch(() => {
                if (!cancelled) setItem(fallbackItem);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [fallbackItem, slug]);

    if (loading) {
        return <NewsDetailSkeleton />;
    }

    if (!item) {
        return (
            <Layout>
                <SEO title="Article Not Found" canonicalPath="/news" />
                <section className="relative overflow-hidden bg-base-100 text-primary">
                    <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
                    <div className="mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
                        <HeroReveal>
                            <Newspaper size={44} className="mx-auto mb-5 text-secondary" />
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Article unavailable</p>
                            <h1 className="text-4xl font-bold leading-tight md:text-6xl">This update could not be found.</h1>
                            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-base-content/60">
                                The article may have been moved, unpublished, or replaced by a newer announcement.
                            </p>
                            <Link to="/news" className="btn btn-primary mt-8">
                                <ArrowLeft size={16} />
                                Back to news
                            </Link>
                        </HeroReveal>
                    </div>
                </section>
            </Layout>
        );
    }

    const formattedDate = formatDate(item.publishedAt);
    const summary = getSummary(item);
    const readTime = getReadTime(item.content);

    return (
        <Layout>
            <SEO
                title={item.title}
                description={summary}
                canonicalPath={`/news/${slug}`}
                ogType="article"
            />

            <section className="relative overflow-hidden bg-base-100 text-primary">
                <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: "linear-gradient(90deg, var(--uposa-hero-grid) 1px, transparent 1px), linear-gradient(var(--uposa-hero-grid) 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                />
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-28 top-6 h-[520px] w-[520px] object-contain opacity-[0.08] md:h-[700px] md:w-[700px]"
                />

                <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                    <HeroReveal>
                        <div>
                            <Link to="/news" className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-base-content/55 transition hover:text-secondary">
                                <ArrowLeft size={15} />
                                News archive
                            </Link>

                            <div className="mb-6 inline-flex items-center gap-3 border border-primary/15 bg-base-200 px-4 py-2">
                                <div className="grid h-10 w-10 place-items-center bg-secondary text-secondary-content">
                                    <Megaphone size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Association dispatch</p>
                                    <p className="text-sm font-semibold text-primary/70">{formatCategory(item.category)}</p>
                                </div>
                            </div>

                            <h1 className="max-w-5xl text-4xl font-bold leading-[0.98] md:text-6xl lg:text-7xl">
                                {item.title}
                            </h1>
                            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                {summary}
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-base-content/55">
                                <span className="inline-flex items-center gap-2 border border-primary/10 bg-base-100 px-4 py-2">
                                    <Calendar size={16} className="text-secondary" />
                                    {formattedDate}
                                </span>
                                <span className="inline-flex items-center gap-2 border border-primary/10 bg-base-100 px-4 py-2">
                                    <Clock size={16} className="text-secondary" />
                                    {readTime}
                                </span>
                                {item.authorName && (
                                    <span className="inline-flex items-center gap-2 border border-primary/10 bg-base-100 px-4 py-2">
                                        <User size={16} className="text-secondary" />
                                        {item.authorName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <aside className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Article facts</p>
                                        <h2 className="mt-3 text-2xl font-bold leading-tight">A quick read from the UPOSA desk.</h2>
                                    </div>
                                    <Newspaper className="text-secondary" size={34} />
                                </div>

                                <dl className="mt-8 grid gap-3">
                                    {[
                                        ["Category", formatCategory(item.category)],
                                        ["Published", formattedDate],
                                        ["Reading time", readTime],
                                    ].map(([label, value]) => (
                                        <div key={label} className="border border-primary-content/10 bg-primary-content/10 p-4">
                                            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/50">{label}</dt>
                                            <dd className="mt-1 font-bold">{value}</dd>
                                        </div>
                                    ))}
                                </dl>

                                <ShareButton title={item.title} className="btn-secondary mt-5 w-full" />
                            </div>
                        </aside>
                    </ScrollReveal>
                </div>
            </section>

            <section className="bg-base-200 py-12 md:py-16">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                    <div className="space-y-8">
                        <ScrollReveal>
                            <NewsHeroImage src={item.imageUrl} title={item.title} />
                        </ScrollReveal>

                        <ScrollReveal delay={0.1}>
                            <article className="border border-primary/10 bg-base-100 p-6 shadow-sm md:p-10">
                                <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-primary/10 pb-5">
                                    <span className="inline-flex items-center gap-2 bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-secondary-content">
                                        <Tag size={13} />
                                        {formatCategory(item.category)}
                                    </span>
                                    <span className="text-sm font-semibold text-base-content/50">{formattedDate}</span>
                                </div>

                                {item.content ? (
                                    <MarkdownContent content={item.content} />
                                ) : (
                                    <p className="text-lg leading-relaxed text-base-content/65">{summary}</p>
                                )}
                            </article>
                        </ScrollReveal>
                    </div>

                    <ScrollReveal delay={0.15}>
                        <aside className="sticky top-28 space-y-5">
                            <div className="border border-primary/10 bg-base-100 p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Keep reading</p>
                                <h2 className="mt-3 text-2xl font-bold leading-tight text-primary">Return to the archive for more dispatches.</h2>
                                <p className="mt-3 text-sm leading-relaxed text-base-content/60">
                                    Browse announcements, project reports, and community stories from the association desk.
                                </p>
                                <Link to="/news" className="btn btn-primary mt-5 w-full">
                                    More updates
                                    <ArrowRight size={16} />
                                </Link>
                            </div>

                            <div className="border border-primary/10 bg-base-100 p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Have a story?</p>
                                <p className="mt-3 text-sm leading-relaxed text-base-content/60">
                                    Share verified alumni, school, or association updates with the UPOSA team.
                                </p>
                                <Link to="/contact?subject=Share News" className="btn btn-outline mt-5 w-full border-primary/15 text-primary">
                                    Contact the news desk
                                </Link>
                            </div>
                        </aside>
                    </ScrollReveal>
                </div>
            </section>
        </Layout>
    );
};

export default NewsDetail;
