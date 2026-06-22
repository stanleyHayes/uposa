import { ParallaxImg } from "../components/common/Parallax.tsx";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
    ArrowRight,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Megaphone,
    Newspaper,
    Search,
    Tag,
    User,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import EmptyState from "../components/common/EmptyState.tsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const PER_PAGE = 6;

type NewsItem = {
    id: string;
    title: string;
    slug: string;
    content?: string | null;
    excerpt?: string | null;
    imageUrl?: string | null;
    category: string;
    authorName?: string | null;
    publishedAt?: string | null;
};

type NewsResponse = {
    data?: NewsItem[];
};

function formatCategory(category: string) {
    if (category === "ALL") return "All";
    return category
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(date?: string | null) {
    if (!date) return "Recent";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getExcerpt(item: NewsItem) {
    if (item.excerpt) return item.excerpt;
    const content = item.content || "";
    return content.length > 160 ? `${content.substring(0, 160)}...` : content || "Full update available in the article.";
}

function ArticleImage({ item, className = "" }: { item: NewsItem; className?: string }) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = Boolean(item.imageUrl) && !imageFailed;

    return (
        <div className={`relative overflow-hidden bg-primary ${className}`}>
            {showImage ? (
                <img
                    src={item.imageUrl || ""}
                    alt={item.title}
                    loading="lazy"
                    onError={() => setImageFailed(true)}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
            ) : (
                <div className="flex h-full min-h-64 flex-col items-center justify-center bg-primary p-8 text-center text-primary-content">
                    <img src="/logo.png" alt="" aria-hidden="true" className="mb-5 h-20 w-20 bg-base-100 object-contain p-2 opacity-90" />
                    <Newspaper size={34} className="text-secondary" />
                </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
    );
}

function ArticleMeta({ item, light = false }: { item: NewsItem; light?: boolean }) {
    const tone = light ? "text-primary-content/65" : "text-base-content/55";

    return (
        <div className={`flex flex-wrap items-center gap-3 text-xs font-semibold ${tone}`}>
            <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} />
                {formatDate(item.publishedAt)}
            </span>
            {item.authorName && (
                <span className="inline-flex items-center gap-1.5">
                    <User size={13} />
                    {item.authorName}
                </span>
            )}
        </div>
    );
}

const News = () => {
    const { data, loading } = useSiteData();
    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [category, setCategory] = useState("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetch(`${API_BASE}/news`)
            .then(async (response) => response.json() as Promise<NewsResponse>)
            .then((json) => setAllNews(Array.isArray(json.data) ? json.data : []))
            .catch(() => setAllNews(data?.latestNews || []));
    }, [data]);

    const categories = useMemo(() => {
        const unique = new Set(allNews.map((item) => item.category).filter(Boolean));
        return ["ALL", ...Array.from(unique)];
    }, [allNews]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return allNews.filter((item) => {
            const matchesCategory = category === "ALL" || item.category === category;
            const matchesSearch = !query
                || item.title.toLowerCase().includes(query)
                || getExcerpt(item).toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [allNews, category, search]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const featuredArticle = paginated[0];
    const secondaryArticles = paginated.slice(1);

    if (loading || !data) {
        return <SplashScreen />;
    }

    return (
        <Layout>
            <SEO
                title="News & Announcements"
                description="Stay updated with the latest news, announcements, and stories from UPOSA and University Practice Senior High School."
                canonicalPath="/news"
            />

            <section className="relative overflow-hidden bg-base-100 text-primary">
                <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: "linear-gradient(90deg, var(--uposa-hero-grid) 1px, transparent 1px), linear-gradient(var(--uposa-hero-grid) 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                />
                <ParallaxImg
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 top-8 h-[520px] w-[520px] object-contain opacity-[0.08] md:h-[680px] md:w-[680px]"
                />

                <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1fr_420px] lg:items-center">
                    <HeroReveal>
                        <div className="max-w-4xl">
                            <div className="mb-8 inline-flex items-center gap-3 border border-primary/15 bg-base-200 px-4 py-2">
                                <img src="/logo.png" alt="UPOSA crest" className="h-10 w-10 bg-base-100 object-contain p-1" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">News desk</p>
                                    <p className="text-sm font-semibold text-primary/70">Announcements, reports, and alumni stories</p>
                                </div>
                            </div>

                            <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                                <Megaphone size={16} />
                                Association dispatches
                            </p>
                            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] md:text-7xl">
                                The updates old students should not miss.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                Follow association announcements, school milestones, project reports, and stories from the UPOSA community.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <a href="#archive" className="btn btn-primary btn-lg">
                                    Browse archive <ArrowRight size={18} />
                                </a>
                                <Link to="/contact?subject=Share News" className="btn btn-secondary btn-lg">
                                    Share a story
                                </Link>
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Archive status</p>
                                        <h2 className="mt-3 text-2xl font-bold">Everything published in one readable index.</h2>
                                    </div>
                                    <Newspaper className="text-secondary" size={34} />
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    <div className="border border-primary-content/10 bg-primary-content/10 p-4">
                                        <p className="text-3xl font-bold">{allNews.length}</p>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/55">Articles</p>
                                    </div>
                                    <div className="border border-primary-content/10 bg-primary-content/10 p-4">
                                        <p className="text-3xl font-bold">{categories.length - 1}</p>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/55">Categories</p>
                                    </div>
                                </div>

                                {featuredArticle && (
                                    <div className="mt-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Latest</p>
                                        <p className="mt-2 line-clamp-2 font-bold text-primary-content/85">{featuredArticle.title}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section id="archive" className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">News archive</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-tight text-primary md:text-5xl">Latest from the association desk.</h2>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-base-content/60">
                                    Filter by category or search the archive to find announcements, reports, and alumni stories.
                                </p>
                            </div>
                            <div className="border border-primary/10 bg-base-100 p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-11 w-11 place-items-center bg-secondary text-secondary-content">
                                        <Search size={19} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Showing</p>
                                        <p className="font-bold text-primary">{filtered.length} of {allNews.length} articles</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="mb-8 grid gap-4 border-y border-primary/10 py-4 lg:grid-cols-[1fr_320px] lg:items-center">
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        className={`border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${category === cat
                                            ? "border-primary bg-primary text-primary-content shadow-sm"
                                            : "border-primary/15 bg-base-100 text-primary hover:border-secondary hover:text-secondary"
                                        }`}
                                        onClick={() => {
                                            setCategory(cat);
                                            setPage(1);
                                        }}
                                    >
                                        {formatCategory(cat)}
                                    </button>
                                ))}
                            </div>
                            <label className="relative block">
                                <span className="sr-only">Search news</span>
                                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/35" />
                                <input
                                    type="search"
                                    placeholder="Search news..."
                                    className="input input-bordered w-full border-primary/15 bg-base-100 pl-10 focus:border-secondary"
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                        setPage(1);
                                    }}
                                />
                            </label>
                        </div>
                    </ScrollReveal>

                    {featuredArticle ? (
                        <>
                            <ScrollReveal>
                                <Link to={`/news/${featuredArticle.slug}`} className="group grid overflow-hidden border border-primary/10 bg-base-100 shadow-sm lg:grid-cols-[1.08fr_0.92fr]">
                                    <ArticleImage item={featuredArticle} className="min-h-[340px] lg:min-h-[460px]" />
                                    <div className="flex flex-col p-6 md:p-8">
                                        <div className="mb-8 flex flex-wrap items-center gap-3">
                                            <span className="inline-flex items-center gap-2 bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-secondary-content">
                                                <Tag size={13} />
                                                {formatCategory(featuredArticle.category)}
                                            </span>
                                            <ArticleMeta item={featuredArticle} />
                                        </div>
                                        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-secondary">Featured dispatch</p>
                                        <h3 className="text-3xl font-bold leading-tight text-primary md:text-5xl">{featuredArticle.title}</h3>
                                        <p className="mt-5 line-clamp-4 text-base leading-relaxed text-base-content/60">{getExcerpt(featuredArticle)}</p>
                                        <div className="mt-auto pt-8">
                                            <span className="btn btn-primary">
                                                Read article <ArrowRight size={17} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </ScrollReveal>

                            {secondaryArticles.length > 0 && (
                                <StaggerChildren className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                    {secondaryArticles.map((item) => (
                                        <Link key={item.id} to={`/news/${item.slug}`} className="group flex h-full flex-col overflow-hidden border border-primary/10 bg-base-100 shadow-sm transition-all hover:-translate-y-0.5 hover:border-secondary/60 hover:shadow-lg">
                                            <ArticleImage item={item} className="h-56" />
                                            <div className="flex flex-1 flex-col p-5">
                                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                                    <span className="bg-base-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                                                        {formatCategory(item.category)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-base-content/45">
                                                        <Clock size={12} />
                                                        {formatDate(item.publishedAt)}
                                                    </span>
                                                </div>
                                                <h3 className="line-clamp-2 text-xl font-bold leading-tight text-primary group-hover:text-secondary">{item.title}</h3>
                                                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-base-content/60">{getExcerpt(item)}</p>
                                                <div className="mt-auto pt-5 text-sm font-bold text-primary">
                                                    Read more <ChevronRight size={14} className="inline-block transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </StaggerChildren>
                            )}
                        </>
                    ) : (
                        <EmptyState
                            icon={<Newspaper />}
                            title={search || category !== "ALL" ? "No news matches this view." : "No news yet."}
                            description={search || category !== "ALL"
                                ? "Try another keyword or clear the category filter to keep browsing."
                                : "Stay tuned. UPOSA news, announcements, and community stories will appear here soon."
                            }
                            action={(search || category !== "ALL") && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setSearch("");
                                        setCategory("ALL");
                                        setPage(1);
                                    }}
                                >
                                    Clear filters
                                </button>
                            )}
                        />
                    )}

                    {totalPages > 1 && (
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                            <button
                                type="button"
                                className="btn btn-sm border-primary/15 bg-base-100 text-primary"
                                disabled={page === 1}
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                            >
                                <ChevronLeft size={15} /> Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className={`btn btn-sm ${page === index + 1 ? "btn-primary" : "border-primary/15 bg-base-100 text-primary"}`}
                                    onClick={() => setPage(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="btn btn-sm border-primary/15 bg-base-100 text-primary"
                                disabled={page === totalPages}
                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            >
                                Next <ChevronRight size={15} />
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </Layout>
    );
};

export default News;
