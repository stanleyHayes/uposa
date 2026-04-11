import { Layout } from "../components/layout/Layout.tsx";
import { Link, useParams } from "react-router";
import { ArrowLeft, Clock, User, Tag, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import MarkdownContent from "../components/common/MarkdownContent.tsx";
import StatusPill from "../components/common/StatusPill.tsx";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const NewsDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        fetch(`${API_BASE}/news/${slug}`)
            .then(r => r.json())
            .then(j => setItem(j.data || null))
            .catch(() => setItem(null))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return <SplashScreen />;
    }

    if (!item) {
        return (
            <Layout>
                <section className="bg-primary text-primary-content py-16">
                    <div className="max-w-7xl mx-auto px-4">
                        <HeroReveal>
                            <h1 className="text-4xl font-bold mb-4">Not Found</h1>
                            <p className="text-lg opacity-90">The article you're looking for doesn't exist.</p>
                        </HeroReveal>
                    </div>
                </section>
                <section className="py-16">
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <p className="text-base-content/70 mb-6">This page may have been moved or removed.</p>
                        <Link to="/news" className="btn btn-primary">
                            <ArrowLeft size={16} /> Back to News
                        </Link>
                    </div>
                </section>
            </Layout>
        );
    }

    const formattedDate = item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Recent';

    return (
        <Layout>
            <SEO title={item.title} description={item.excerpt || (item.content || '').substring(0, 150)} canonicalPath={`/news/${slug}`} ogType="article" />

            {/* Hero */}
            <section className="bg-primary text-primary-content py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <HeroReveal>
                        <Link to="/news" className="inline-flex items-center gap-1 text-sm opacity-80 hover:opacity-100 mb-4 transition">
                            <ArrowLeft size={14} /> Back to News
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{item.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm opacity-80">
                            <span className="flex items-center gap-1">
                                <Clock size={14} /> {formattedDate}
                            </span>
                            {item.authorName && (
                                <span className="flex items-center gap-1">
                                    <User size={14} /> {item.authorName}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Tag size={14} /> {item.category}
                            </span>
                        </div>
                    </HeroReveal>
                </div>
            </section>

            {/* Content */}
            <section className="py-12 md:py-16">
                <div className="max-w-3xl mx-auto px-4">
                    {/* Author + Category */}
                    <ScrollReveal>
                        <div className="flex items-center gap-3 mb-8">
                            {item.authorName ? (
                                <div className="flex items-center gap-3">
                                    <div className="avatar placeholder">
                                        <div className="bg-primary text-primary-content w-10 rounded-full">
                                            <span className="text-sm">{item.authorName.charAt(0)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{item.authorName}</p>
                                        <p className="text-xs text-base-content/60">{formattedDate}</p>
                                    </div>
                                </div>
                            ) : (
                                <StatusPill status={item.category} />
                            )}
                        </div>
                    </ScrollReveal>

                    {/* Cover image */}
                    {item.imageUrl && (
                        <ScrollReveal>
                            <div className="overflow-hidden rounded-2xl mb-8">
                                <img src={item.imageUrl} alt={item.title} className="w-full h-64 md:h-80 object-cover" />
                            </div>
                        </ScrollReveal>
                    )}

                    {/* Markdown body */}
                    <ScrollReveal delay={0.1}>
                        <MarkdownContent content={item.content || ''} />
                    </ScrollReveal>

                    {/* Share + Back */}
                    <ScrollReveal delay={0.2}>
                        <div className="border-t mt-12 pt-8 flex flex-wrap items-center justify-between gap-4">
                            <Link to="/news" className="btn btn-outline btn-sm">
                                <ArrowLeft size={14} /> Back to News
                            </Link>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({ title: item.title, url: window.location.href });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                    }
                                }}
                            >
                                <Share2 size={14} /> Share
                            </button>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </Layout>
    );
};

export default NewsDetail;
