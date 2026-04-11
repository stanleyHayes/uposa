import { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout.tsx";
import { Link } from "react-router";
import { Clock, Newspaper, User, ChevronRight } from "lucide-react";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import HeroBanner from "../components/common/HeroBanner.tsx";
import SectionHeader from "../components/common/SectionHeader.tsx";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import EmptyState from "../components/common/EmptyState.tsx";
import StatusPill from "../components/common/StatusPill.tsx";
import { Card } from "../components/ui/Card.tsx";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const News = () => {
    const { data, loading } = useSiteData();
    const [allNews, setAllNews] = useState<any[]>([]);
    const [category, setCategory] = useState('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PER_PAGE = 6;

    useEffect(() => {
        fetch(`${API_BASE}/news`)
            .then(r => r.json())
            .then(j => setAllNews(j.data || []))
            .catch(() => setAllNews(data?.latestNews || []));
    }, [data]);

    const filtered = allNews.filter(n => {
        const matchCat = category === 'ALL' || n.category === category;
        const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    if (loading || !data) {
        return <SplashScreen />;
    }

    return (
        <Layout>
            <SEO title="News & Announcements" description="Stay updated with the latest news, announcements, and stories from UPOSA and University Practice Senior High School." canonicalPath="/news" />
            {/* Hero */}
            <HeroBanner icon={Newspaper} title="News & Announcements" description="Stay informed with the latest updates, announcements, and stories from the UPOSA community." />

            {/* Latest News */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Newspaper} title="Latest News" description="The most recent updates from our alumni community." align="left" />

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {['ALL', 'ANNOUNCEMENT', 'BLOG', 'REPORT'].map(cat => (
                            <button key={cat} className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setCategory(cat); setPage(1); }}>
                                {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                            </button>
                        ))}
                        <input type="text" placeholder="Search..." className="input input-bordered input-sm ml-auto w-48" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>

                    <div className="space-y-5">
                        {paginated.map((item, i) => (
                            <ScrollReveal key={item.id} delay={i * 0.08}>
                                <Link to={`/news/${item.slug}`} className="block group">
                                    <Card>
                                        <div className="flex flex-col sm:flex-row">
                                            {/* Image */}
                                            <div className="sm:w-64 md:w-72 shrink-0">
                                                {item.imageUrl ? (
                                                    <div className="h-48 sm:h-full overflow-hidden">
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.title}
                                                            loading="lazy"
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-48 sm:h-full bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 flex items-center justify-center">
                                                        <Newspaper size={40} className="text-primary/15" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-5 sm:p-6 flex flex-col">
                                                <div className="flex flex-wrap items-center gap-2.5 mb-3">
                                                    <StatusPill status={item.category} />
                                                    <span className="w-1 h-1 rounded-full bg-base-content/20" />
                                                    <span className="flex items-center gap-1 text-xs text-base-content/50">
                                                        <Clock size={12} />
                                                        {item.publishedAt
                                                            ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                            : 'Recent'}
                                                    </span>
                                                    {item.authorName && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-base-content/20" />
                                                            <span className="flex items-center gap-1 text-xs text-base-content/50">
                                                                <User size={12} />
                                                                {item.authorName}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                <h3 className="font-bold text-lg leading-snug mb-2 group-hover:text-primary transition-colors">
                                                    {item.title}
                                                </h3>
                                                <p className="text-base-content/55 text-sm leading-relaxed line-clamp-2 flex-1">
                                                    {item.excerpt || item.content.substring(0, 160) + '...'}
                                                </p>

                                                <div className="mt-4 flex items-center text-sm font-semibold text-primary gap-1 group-hover:gap-2 transition-all">
                                                    Read article <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            </ScrollReveal>
                        ))}
                        {paginated.length === 0 && (
                            <EmptyState
                                icon={<Newspaper size={40} />}
                                title="No News Yet"
                                description="Stay tuned! We'll be sharing the latest UPOSA news, announcements, and stories from the alumni community soon."
                            />
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button className="btn btn-sm btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button key={i} className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                            ))}
                            <button className="btn btn-sm btn-ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
                        </div>
                    )}
                </div>
            </section>
        </Layout>
    );
};

export default News;
