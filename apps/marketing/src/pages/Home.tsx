import { useState } from "react";
import { Link } from "react-router";
import {
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    CreditCard,
    FileText,
    FolderOpen,
    GraduationCap,
    HandHeart,
    Heart,
    Mail,
    MapPin,
    Megaphone,
    Newspaper,
    PhoneCall,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    Trophy,
    User,
    Users,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import { AnimatedCounter } from "../components/common/AnimatedCounter.tsx";
import SEO from "../components/common/SEO.tsx";
import EmptyState from "../components/common/EmptyState.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import { subscribeNewsletter } from "../api/client.ts";
import SplashScreen from "../components/common/SplashScreen.tsx";
import { SkeletonBlock } from "../components/common/Skeleton.tsx";
import { Card, CardAccent, CardBody } from "../components/ui/Card.tsx";

const formatDate = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
    if (!value) return "Date to be announced";
    return new Date(value).toLocaleDateString("en-US", options);
};

const formatCategory = (value?: string | null) => {
    if (!value) return "Update";
    return value.charAt(0) + value.slice(1).toLowerCase();
};

const formatMoney = (value: number) => `GH₵ ${value.toLocaleString()}`;

const progressFor = (raisedAmount: number, goalAmount: number) => {
    if (goalAmount <= 0) return 0;
    return Math.min(Math.round((raisedAmount / goalAmount) * 100), 100);
};

const Home = () => {
    const { data, loading } = useSiteData();
    const [nlDone, setNlDone] = useState(false);
    const [nlLoading, setNlLoading] = useState(false);
    const [nlError, setNlError] = useState("");

    if (loading || !data) {
        return <SplashScreen />;
    }

    const stats = data.config.stats;
    const school = data.config.schoolInfo;
    const upcomingEvents = data.upcomingEvents;
    const ongoingProjects = data.ongoingProjects;
    const latestNews = data.latestNews;
    const featuredEvent = upcomingEvents[0];
    const featuredNews = latestNews[0];
    const contactEmail = data.config.contact.emails.general || "info@uposa.org";
    const contactPhone = data.config.contact.phones[0] || "0244036676";
    const contactAddress = data.config.contact.address || `${school.name}, ${school.location}`;

    const statCards = [
        { value: stats.members, suffix: "+", label: "registered old students", icon: Users },
        { value: stats.years, suffix: "+", label: "years of school legacy", icon: GraduationCap },
        { value: stats.projects, suffix: "+", label: "completed association projects", icon: FolderOpen },
        { value: stats.events, suffix: "+", label: "organized alumni events", icon: Trophy },
    ];

    const actionCards = [
        { title: "Register", kicker: "membership", description: "Join the old students network and keep your details current.", to: "/membership", icon: Users },
        { title: "Pay dues", kicker: "payments", description: "Support association operations and year-group commitments.", to: "/membership#dues", icon: CreditCard },
        { title: "Donate", kicker: "projects", description: "Back current priorities for students, staff, and facilities.", to: "/donate", icon: Heart },
        { title: "Contact", kicker: "support", description: "Reach the UPOSA desk for questions, documents, and help.", to: "/contact", icon: PhoneCall },
    ];

    const serviceCards = [
        { title: "Alumni directory", description: "Find year groups, classmates, executives, and community contacts.", to: "/membership#directory", icon: Search },
        { title: "Mentorship", description: "Connect old students with students and younger alumni looking for guidance.", to: "/community#mentorship", icon: HandHeart },
        { title: "Transcript requests", description: "Start official school document support through the contact services path.", to: "/contact", icon: FileText },
        { title: "Announcements", description: "Follow decisions, dues notices, public stories, and school milestones.", to: "/news", icon: Megaphone },
    ];
    const dispatchNews = latestNews.length > 1 ? latestNews.slice(1, 4) : latestNews.slice(0, 3);

    return (
        <Layout>
            <SEO canonicalPath="/" />

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
                    className="pointer-events-none absolute -right-28 top-8 h-[520px] w-[520px] object-contain opacity-[0.08] md:top-4 md:h-[680px] md:w-[680px]"
                />

                <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1fr_430px] lg:items-center lg:py-20">
                    <HeroReveal>
                        <div className="max-w-4xl">
                            <div className="mb-8 inline-flex items-center gap-3 border border-primary/15 bg-base-200 px-4 py-2">
                                <img src="/logo.png" alt="UPOSA crest" className="h-10 w-10 bg-base-100 object-contain p-1" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">The Legit Elites</p>
                                    <p className="text-sm font-semibold text-primary/70">University Practice Old Students Association</p>
                                </div>
                            </div>

                            <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                                <ShieldCheck size={16} />
                                Home base for old students
                            </p>
                            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] md:text-7xl">
                                One desk for alumni, dues, projects, events, and school support.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                UPOSA now opens with the actions old students actually need: register, pay dues, support projects, follow events, and stay connected to University Practice.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <Link to="/membership" className="btn btn-primary btn-lg">
                                    Register as a member <ArrowRight size={18} />
                                </Link>
                                <Link to="/projects" className="btn btn-secondary btn-lg">
                                    See active projects
                                </Link>
                            </div>

                            <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
                                {[
                                    ["School", school.abbreviation || "UPSHS"],
                                    ["Founded", String(school.founded || "1976")],
                                    ["Location", school.location || "Cape Coast"],
                                ].map(([label, value]) => (
                                    <div key={label} className="border-l-4 border-secondary bg-base-200 px-4 py-3">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">{label}</p>
                                        <p className="mt-1 font-bold text-primary">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">UPOSA Desk</p>
                                        <h2 className="mt-2 text-3xl font-bold leading-tight">What do you need today?</h2>
                                    </div>
                                    <img src="/logo.png" alt="" aria-hidden="true" className="h-16 w-16 shrink-0 bg-primary-content object-contain p-1.5" />
                                </div>
                                <div className="mt-7 space-y-3">
                                    {actionCards.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link key={item.title} to={item.to} className="group flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4 transition-all hover:bg-primary-content/20">
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-secondary text-secondary-content">
                                                    <Icon size={21} />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-primary-content/45">{item.kicker}</span>
                                                    <span className="mt-0.5 block font-bold">{item.title}</span>
                                                </span>
                                                <ArrowUpRight size={17} className="shrink-0 text-primary-content/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-secondary" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="bg-primary text-primary-content">
                <div className="mx-auto max-w-7xl px-4 py-7">
                    <StaggerChildren className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="border border-primary-content/10 bg-primary-content/10 p-5">
                                    <div className="mb-5 flex items-center justify-between">
                                        <Icon size={22} className="text-secondary" />
                                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary-content/35">Impact</span>
                                    </div>
                                    <p className="text-4xl font-bold leading-none">
                                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-primary-content/55">{stat.label}</p>
                                </div>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            <section className="relative overflow-hidden bg-base-100 py-16 md:py-24">
                <div className="absolute left-0 top-0 h-full w-2 bg-secondary" />
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-28 right-4 h-[340px] w-[340px] object-contain opacity-[0.035]"
                />
                <div className="mx-auto max-w-7xl px-4">
                    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                        <ScrollReveal direction="right">
                            <div className="sticky top-24">
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Association operating model</p>
                                <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">
                                    The homepage is now a working front desk, not a poster.
                                </h2>
                                <p className="mt-5 leading-relaxed text-base-content/65">
                                    It points old students toward the practical places they need while still telling the UPOSA story: legacy, connection, service, and support for the school.
                                </p>
                            </div>
                        </ScrollReveal>

                        <StaggerChildren className="grid auto-rows-fr gap-5 sm:grid-cols-2">
                            {serviceCards.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <Link key={item.title} to={item.to} className="group block h-full">
                                        <Card className="flex h-full flex-col">
                                            <CardAccent color={index % 2 === 0 ? "primary" : "secondary"} />
                                            <CardBody className="flex flex-1 flex-col">
                                                <div className="mb-7 flex items-start justify-between gap-4">
                                                    <div className="flex h-14 w-14 items-center justify-center bg-secondary/10 text-secondary">
                                                        <Icon size={26} />
                                                    </div>
                                                    <span className="flex h-9 w-9 items-center justify-center border border-base-300 text-base-content/30 transition-all group-hover:border-secondary/40 group-hover:text-secondary">
                                                        <ArrowUpRight size={17} />
                                                    </span>
                                                </div>
                                                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-base-content/35">Path {String(index + 1).padStart(2, "0")}</p>
                                                <h3 className="text-xl font-bold text-primary">{item.title}</h3>
                                                <p className="mt-3 text-sm leading-relaxed text-base-content/60">{item.description}</p>
                                                <div className="mt-auto flex items-center gap-2 pt-7 text-sm font-bold text-primary">
                                                    Open path <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </StaggerChildren>
                    </div>
                </div>
            </section>

            <section className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Happening now</p>
                                <h2 className="text-4xl font-bold text-primary md:text-5xl">Events and updates with real next steps.</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link to="/events" className="btn btn-primary btn-sm">Events</Link>
                                <Link to="/news" className="btn btn-ghost btn-sm text-primary">News</Link>
                            </div>
                        </div>
                    </ScrollReveal>

                    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
                        <Card shape="ticket" className="h-full">
                            <CardAccent color="secondary" />
                            <CardBody className="flex h-full flex-col">
                                <div className="mb-8 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-base-content/40">Next UPOSA event</p>
                                        <h3 className="mt-2 text-2xl font-bold text-primary">Alumni calendar</h3>
                                    </div>
                                    <Calendar size={34} className="text-secondary" />
                                </div>

                                {featuredEvent ? (
                                    <>
                                        <div className="mb-6 flex items-start gap-5">
                                            <div className="min-w-20 bg-primary px-4 py-3 text-center text-primary-content">
                                                <p className="text-xs font-bold uppercase">{formatDate(featuredEvent.date, { month: "short" })}</p>
                                                <p className="text-4xl font-bold leading-none">{new Date(featuredEvent.date).getDate()}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold leading-snug text-primary">{featuredEvent.title}</h4>
                                                <p className="mt-3 flex items-center gap-1.5 text-sm text-base-content/60">
                                                    <MapPin size={14} />
                                                    {featuredEvent.location || "Location to be announced"}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="line-clamp-4 text-sm leading-relaxed text-base-content/60">{featuredEvent.description}</p>
                                        <div className="mt-auto pt-7">
                                            <Link to="/events" className="btn btn-primary">
                                                RSVP or view events <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </>
                                ) : (
                                    <EmptyState icon={<Calendar size={36} />} title="No upcoming events" description="Stay tuned for reunions and gatherings." />
                                )}
                            </CardBody>
                        </Card>

                        <div className="grid gap-6">
                            {featuredNews && (
                                <Link to={`/news/${featuredNews.slug}`} className="group block">
                                    <div className="grid overflow-hidden border border-base-300 bg-base-100 md:grid-cols-[0.95fr_1.05fr]">
                                        {featuredNews.imageUrl ? (
                                            <img src={featuredNews.imageUrl} alt={featuredNews.title} className="h-full min-h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                                        ) : (
                                            <div className="relative min-h-64 overflow-hidden bg-primary p-8 text-primary-content">
                                                <img src="/logo.png" alt="" aria-hidden="true" className="absolute -right-10 top-8 h-60 w-60 object-contain opacity-[0.1]" />
                                                <Newspaper size={44} className="relative text-secondary" />
                                            </div>
                                        )}
                                        <div className="p-6 md:p-8">
                                            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-base-content/45">
                                                <span className="bg-secondary/10 px-3 py-1 text-secondary">{formatCategory(featuredNews.category)}</span>
                                                {featuredNews.publishedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {formatDate(featuredNews.publishedAt, { month: "short", day: "numeric", year: "numeric" })}
                                                    </span>
                                                )}
                                                {featuredNews.authorName && (
                                                    <span className="flex items-center gap-1">
                                                        <User size={12} />
                                                        {featuredNews.authorName}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-3xl font-bold leading-tight text-primary">{featuredNews.title}</h3>
                                            <p className="mt-4 line-clamp-3 leading-relaxed text-base-content/60">
                                                {featuredNews.excerpt || featuredNews.content?.slice(0, 180)}
                                            </p>
                                            <div className="mt-8 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                                                Read update <ChevronRight size={15} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {upcomingEvents.length > 1 && (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {upcomingEvents.slice(1, 5).map((event) => (
                                        <Link key={event.id} to="/events" className="group flex items-center gap-4 border border-base-300 bg-base-100 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
                                            <div className="w-16 shrink-0 bg-secondary/10 px-2 py-2 text-center text-primary">
                                                <p className="text-[10px] font-bold uppercase">{formatDate(event.date, { month: "short" })}</p>
                                                <p className="text-2xl font-bold leading-none">{new Date(event.date).getDate()}</p>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-bold text-primary">{event.title}</p>
                                                <p className="mt-1 truncate text-sm text-base-content/50">{event.location || "Location to be announced"}</p>
                                            </div>
                                            <ChevronRight size={17} className="shrink-0 text-base-content/30 group-hover:text-secondary" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden bg-primary text-primary-content">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                    <ScrollReveal direction="right">
                        <div>
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Priority funding</p>
                            <h2 className="text-4xl font-bold leading-tight md:text-5xl">Make support visible. Make progress measurable.</h2>
                            <p className="mt-5 leading-relaxed text-primary-content/65">
                                Current projects are presented as funding workstreams, so alumni can see what is moving, how much has been raised, and where help is needed.
                            </p>
                            <Link to="/projects" className="btn btn-secondary mt-8">
                                View all projects <ArrowRight size={16} />
                            </Link>
                        </div>
                    </ScrollReveal>

                    {ongoingProjects.length === 0 ? (
                        <EmptyState icon={<BookOpen size={36} />} title="No active projects" description="We're preparing new initiatives to support our alma mater." />
                    ) : (
                        <div className="grid gap-4">
                            {ongoingProjects.slice(0, 4).map((project, index) => {
                                const progress = progressFor(project.raisedAmount, project.goalAmount);
                                return (
                                    <Link key={project.id} to={`/projects/${project.slug}`} className="group grid border border-primary-content/10 bg-primary-content/10 p-4 transition-all hover:bg-primary-content/15 md:grid-cols-[96px_1fr_auto] md:items-center md:gap-5">
                                        <div className="mb-4 flex h-20 w-20 items-center justify-center bg-secondary text-secondary-content md:mb-0">
                                            <span className="text-2xl font-bold">{String(index + 1).padStart(2, "0")}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/35">{project.status}</p>
                                            <h3 className="mt-1 text-xl font-bold">{project.title}</h3>
                                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-primary-content/55">{project.description}</p>
                                            <div className="mt-4 h-2 overflow-hidden bg-primary-content/10">
                                                <div className="h-full bg-secondary" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                        <div className="mt-4 text-left md:mt-0 md:text-right">
                                            <p className="text-2xl font-bold text-secondary">{progress}%</p>
                                            <p className="text-xs text-primary-content/45">{formatMoney(project.raisedAmount)} raised</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section className="relative overflow-hidden bg-base-100 py-16 md:py-24">
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-20 top-8 h-[300px] w-[300px] object-contain opacity-[0.03]"
                />
                <div className="relative mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Latest dispatches</p>
                                <h2 className="text-4xl font-bold text-primary md:text-5xl">Announcements alumni should not miss.</h2>
                            </div>
                            <Link to="/news" className="btn btn-primary btn-sm">
                                View all news <ArrowRight size={16} />
                            </Link>
                        </div>
                    </ScrollReveal>

                    {latestNews.length === 0 ? (
                        <EmptyState icon={<Newspaper size={36} />} title="No articles yet" description="Fresh association updates will appear here as they are published." />
                    ) : (
                        <StaggerChildren className="grid auto-rows-fr gap-5 md:grid-cols-3">
                            {dispatchNews.map((article) => (
                                <Link key={article.id} to={`/news/${article.slug}`} className="block h-full group">
                                    <Card className="flex h-full flex-col">
                                        {article.imageUrl ? (
                                            <div className="aspect-[16/10] overflow-hidden bg-primary/5">
                                                <img src={article.imageUrl} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                                            </div>
                                        ) : (
                                            <div className="relative aspect-[16/10] overflow-hidden bg-primary text-primary-content">
                                                <img src="/logo.png" alt="" aria-hidden="true" className="absolute -right-8 top-4 h-44 w-44 object-contain opacity-[0.1]" />
                                                <Newspaper size={42} className="absolute bottom-6 left-6 text-secondary" />
                                            </div>
                                        )}
                                        <CardBody className="flex flex-1 flex-col">
                                            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-base-content/45">
                                                <span className="bg-secondary/10 px-2.5 py-1 text-secondary">{formatCategory(article.category)}</span>
                                                {article.publishedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={11} />
                                                        {formatDate(article.publishedAt, { month: "short", day: "numeric" })}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="line-clamp-2 text-lg font-bold leading-snug text-primary group-hover:text-accent">{article.title}</h3>
                                            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-base-content/60">
                                                {article.excerpt || article.content?.slice(0, 120)}
                                            </p>
                                            <div className="mt-auto flex items-center justify-between border-t border-base-300/45 pt-6 text-sm font-bold text-primary">
                                                <span>Read dispatch</span>
                                                <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Link>
                            ))}
                        </StaggerChildren>
                    )}
                </div>
            </section>

            <section className="relative overflow-hidden bg-base-200 py-16 md:py-24">
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 bottom-8 h-[360px] w-[360px] object-contain opacity-[0.035]"
                />
                <div className="relative mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[380px_1fr] lg:items-stretch">
                    <ScrollReveal direction="right">
                        <div className="flex h-full flex-col border border-base-300 bg-base-100 p-6 shadow-sm md:p-8">
                            <div className="mb-8 flex items-center justify-between gap-4">
                                <span className="flex h-14 w-14 items-center justify-center bg-secondary/10 text-secondary">
                                    <PhoneCall size={25} />
                                </span>
                                <span className="text-xs font-bold uppercase tracking-[0.18em] text-base-content/35">UPOSA desk</span>
                            </div>
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Contact and services</p>
                            <h2 className="text-xl font-bold leading-tight text-primary md:text-2xl">The common paths are now impossible to miss.</h2>
                            <p className="mt-5 leading-relaxed text-base-content/65">
                                UPOSA's home page ends with clear service doors for members who need support, information, payments, or documents.
                            </p>
                            <div className="mt-7 space-y-3 text-sm text-base-content/65">
                                <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 transition-colors hover:text-primary">
                                    <Mail size={17} className="text-secondary" />
                                    {contactEmail}
                                </a>
                                <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="flex items-center gap-3 transition-colors hover:text-primary">
                                    <PhoneCall size={17} className="text-secondary" />
                                    {contactPhone}
                                </a>
                                <p className="flex items-center gap-3">
                                    <MapPin size={17} className="text-secondary" />
                                    {contactAddress}
                                </p>
                            </div>
                            <div className="mt-auto pt-8">
                                <a href={`mailto:${contactEmail}`} className="btn btn-primary w-full">
                                    Email the desk <ArrowRight size={16} />
                                </a>
                            </div>
                        </div>
                    </ScrollReveal>

                    <StaggerChildren className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {[...actionCards, ...serviceCards.slice(0, 2)].map((item, index) => {
                            const Icon = item.icon;
                            const kicker = "kicker" in item && typeof item.kicker === "string" ? item.kicker : "service";
                            return (
                                <Link key={item.title} to={item.to} className="block h-full">
                                    <div className="group flex h-full flex-col border border-base-300 bg-base-100 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg">
                                        <div className="mb-6 flex items-center justify-between">
                                            <span className="flex h-12 w-12 items-center justify-center bg-secondary/10 text-secondary">
                                                <Icon size={22} />
                                            </span>
                                            <span className="text-xs font-bold text-base-content/25">{String(index + 1).padStart(2, "0")}</span>
                                        </div>
                                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-secondary">{kicker}</p>
                                        <h3 className="font-bold text-primary">{item.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-base-content/60">{item.description}</p>
                                        <div className="mt-auto flex items-center justify-between pt-6 text-sm font-bold text-primary">
                                            <span>Open</span>
                                            <CheckCircle2 size={17} className="text-primary/25 transition-colors group-hover:text-secondary" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            <section className="relative overflow-hidden bg-primary py-16 text-primary-content md:py-24">
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: "linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)",
                        backgroundSize: "42px 42px",
                    }}
                />
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-36 -right-16 h-[420px] w-[420px] object-contain opacity-[0.1]"
                />
                <ScrollReveal>
                    <div className="relative mx-auto max-w-4xl px-4 text-center">
                        <div className="mb-6 inline-flex items-center gap-2 border border-primary-content/12 bg-primary-content/10 px-4 py-2">
                            <Sparkles size={14} className="text-secondary" />
                            <span className="text-sm font-semibold text-primary-content/80">Newsletter</span>
                        </div>
                        <h2 className="text-4xl font-bold leading-tight md:text-5xl">Keep the old students network close.</h2>
                        <p className="mx-auto mt-5 max-w-xl text-primary-content/70">
                            Get announcements on events, dues, projects, and alumni stories straight to your inbox.
                        </p>
                        {nlDone ? (
                            <p className="mt-8 font-semibold text-secondary">You're subscribed. We'll keep you posted.</p>
                        ) : (
                            <form
                                className="mx-auto mt-9 flex max-w-lg flex-col gap-3 sm:flex-row"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setNlLoading(true);
                                    setNlError("");
                                    const fd = new FormData(e.currentTarget);
                                    try {
                                        await subscribeNewsletter(fd.get("email") as string);
                                        setNlDone(true);
                                    } catch (error) {
                                        setNlError(error instanceof Error ? error.message : "Failed to subscribe");
                                    } finally {
                                        setNlLoading(false);
                                    }
                                }}
                            >
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="input input-bordered w-full border-primary-content/15 bg-primary-content/10 text-primary-content placeholder:text-primary-content/45 sm:flex-1"
                                    required
                                />
                                <button type="submit" className="btn btn-secondary w-full sm:w-auto" disabled={nlLoading}>
                                    {nlLoading ? <SkeletonBlock className="h-4 w-24 bg-secondary-content/25" /> : (
                                        <>
                                            Subscribe <Send size={15} />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                        {nlError && <p className="mt-3 text-sm text-primary-content/70">{nlError}</p>}
                    </div>
                </ScrollReveal>
            </section>
        </Layout>
    );
};

export default Home;
