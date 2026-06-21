import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    FolderKanban,
    FolderOpen,
    HandHeart,
    Heart,
    Megaphone,
    Search,
    Target,
    Trophy,
    Users,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import EmptyState from "../components/common/EmptyState.tsx";
import StatusPill from "../components/common/StatusPill.tsx";
import { SkeletonBlock } from "../components/common/Skeleton.tsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const PER_PAGE = 6;

type ProjectStatusFilter = "ALL" | "ONGOING" | "COMPLETED" | "PAUSED";

interface ProjectMilestone {
    title: string;
    description?: string | null;
    date?: string | null;
    completed: boolean;
}

interface ProjectItem {
    id: string;
    title: string;
    slug: string;
    description: string;
    content?: string | null;
    imageUrl?: string | null;
    gallery?: string[];
    milestones?: ProjectMilestone[];
    goalAmount: number;
    raisedAmount: number;
    status: string;
    isFeatured: boolean;
    startDate?: string | null;
    endDate?: string | null;
}

interface ProjectsResponse {
    data?: ProjectItem[];
    ongoingProjects?: ProjectItem[];
}

function progressFor(raisedAmount = 0, goalAmount = 0) {
    if (goalAmount <= 0) return 0;
    return Math.min(100, Math.round((raisedAmount / goalAmount) * 100));
}

function formatMoney(amount = 0) {
    return `GH₵ ${amount.toLocaleString()}`;
}

function formatStatus(status: string) {
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date?: string | null) {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function ProjectImage({ src, title, className = "" }: { src?: string | null; title: string; className?: string }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className={`relative grid place-items-center overflow-hidden bg-primary ${className}`}>
                <img src="/logo.png" alt="" aria-hidden="true" className="h-28 w-28 object-contain opacity-20" />
                <div
                    className="absolute inset-0 opacity-15"
                    style={{
                        backgroundImage: "linear-gradient(90deg, #ffffff 1px, transparent 1px), linear-gradient(#ffffff 1px, transparent 1px)",
                        backgroundSize: "34px 34px",
                    }}
                />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={title}
            className={`object-cover ${className}`}
            onError={() => setFailed(true)}
        />
    );
}

function ProjectProgress({ project, dark = false }: { project: ProjectItem; dark?: boolean }) {
    const progress = progressFor(project.raisedAmount, project.goalAmount);

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm font-semibold">
                <span className={dark ? "text-primary-content/70" : "text-base-content/55"}>{progress}% funded</span>
                <span className={dark ? "text-secondary" : "text-primary"}>{formatMoney(project.raisedAmount)}</span>
            </div>
            <div className={dark ? "h-2 overflow-hidden bg-primary-content/10" : "h-2 overflow-hidden bg-base-300"}>
                <div className="h-full bg-secondary transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <div className={`mt-2 flex items-center justify-between text-xs ${dark ? "text-primary-content/45" : "text-base-content/45"}`}>
                <span>Raised</span>
                <span>{project.goalAmount > 0 ? `${formatMoney(project.goalAmount)} target` : "Open support"}</span>
            </div>
        </div>
    );
}

const Projects = () => {
    const { data, loading } = useSiteData();
    const [allProjects, setAllProjects] = useState<ProjectItem[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [status, setStatus] = useState<ProjectStatusFilter>("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;

        setProjectsLoading(true);
        fetch(`${API_BASE}/projects`)
            .then((response) => response.json() as Promise<ProjectsResponse>)
            .then((responseData) => {
                if (!cancelled) {
                    setAllProjects(responseData.data || responseData.ongoingProjects || data?.ongoingProjects || []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setAllProjects(data?.ongoingProjects || []);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setProjectsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [data]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return allProjects.filter((project) => {
            const matchesStatus = status === "ALL" || project.status.toUpperCase() === status;
            const matchesSearch =
                !query ||
                project.title.toLowerCase().includes(query) ||
                project.description.toLowerCase().includes(query);

            return matchesStatus && matchesSearch;
        });
    }, [allProjects, search, status]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const featuredProject = useMemo(
        () => filtered.find((project) => project.isFeatured) || filtered.find((project) => project.status.toUpperCase() === "ONGOING") || filtered[0],
        [filtered],
    );

    const secondaryProjects = paginated.filter((project) => project.id !== featuredProject?.id);

    const ongoingCount = allProjects.filter((project) => project.status.toUpperCase() === "ONGOING").length;
    const completedCount = allProjects.filter((project) => project.status.toUpperCase() === "COMPLETED").length;
    const totalRaised = allProjects.reduce((total, project) => total + (project.raisedAmount || 0), 0);
    const totalGoal = allProjects.reduce((total, project) => total + (project.goalAmount || 0), 0);
    const heroProgress = progressFor(totalRaised, totalGoal);

    if (loading || !data) {
        return <SplashScreen />;
    }

    const statusFilters: ProjectStatusFilter[] = ["ALL", "ONGOING", "COMPLETED", "PAUSED"];

    return (
        <Layout>
            <SEO
                title="Projects"
                description="Explore UPOSA's ongoing and completed projects supporting University Practice Senior High School infrastructure, NSMQ team, and student welfare."
                canonicalPath="/projects"
            />

            <section className="relative overflow-hidden bg-base-100 text-primary">
                <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: "linear-gradient(90deg, #001B50 1px, transparent 1px), linear-gradient(#001B50 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                />
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 top-8 h-[520px] w-[520px] object-contain opacity-[0.08] md:h-[680px] md:w-[680px]"
                />

                <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1fr_430px] lg:items-center">
                    <HeroReveal>
                        <div className="max-w-4xl">
                            <div className="mb-8 inline-flex items-center gap-3 border border-primary/15 bg-base-200 px-4 py-2">
                                <img src="/logo.png" alt="UPOSA crest" className="h-10 w-10 bg-base-100 object-contain p-1" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Projects desk</p>
                                    <p className="text-sm font-semibold text-primary/70">Funding, school support, and visible delivery</p>
                                </div>
                            </div>

                            <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                                <FolderKanban size={16} />
                                Alumni-backed initiatives
                            </p>
                            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] md:text-7xl">
                                Projects alumni can track, fund, and finish.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                Follow the workstreams improving University Practice SHS, from infrastructure and student welfare to NSMQ support.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <a href="#projects" className="btn btn-primary btn-lg">
                                    Browse projects <ArrowRight size={18} />
                                </a>
                                <Link to="/donate" className="btn btn-secondary btn-lg">
                                    Support a project
                                </Link>
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Portfolio status</p>
                                        <h2 className="mt-3 text-2xl font-bold">Funding progress across association priorities.</h2>
                                    </div>
                                    <Target className="text-secondary" size={34} />
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    <div className="border border-primary-content/10 bg-primary-content/10 p-4">
                                        {projectsLoading ? <SkeletonBlock className="h-8 w-14 bg-primary-content/20" /> : <p className="text-3xl font-bold">{allProjects.length}</p>}
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/55">Projects</p>
                                    </div>
                                    <div className="border border-primary-content/10 bg-primary-content/10 p-4">
                                        {projectsLoading ? <SkeletonBlock className="h-8 w-14 bg-primary-content/20" /> : <p className="text-3xl font-bold text-secondary">{heroProgress}%</p>}
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/55">Funded</p>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <ProjectProgress
                                        project={{
                                            id: "portfolio",
                                            title: "Portfolio",
                                            slug: "portfolio",
                                            description: "Portfolio progress",
                                            goalAmount: totalGoal,
                                            raisedAmount: totalRaised,
                                            status: "ONGOING",
                                            isFeatured: false,
                                        }}
                                        dark
                                    />
                                </div>

                                {featuredProject && (
                                    <Link to={`/projects/${featuredProject.slug}`} className="group mt-5 flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4 transition-all hover:bg-primary-content/15">
                                        <div className="grid h-14 w-14 shrink-0 place-items-center bg-secondary text-secondary-content">
                                            <FolderOpen size={22} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Featured priority</p>
                                            <p className="mt-1 truncate font-bold">{featuredProject.title}</p>
                                        </div>
                                        <ChevronRight size={18} className="text-primary-content/35 transition group-hover:text-secondary" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="bg-primary text-primary-content">
                <div className="mx-auto max-w-7xl px-4 py-6">
                    <StaggerChildren className="grid gap-3 md:grid-cols-4">
                        {[
                            { label: "Active projects", value: ongoingCount, icon: Clock },
                            { label: "Completed", value: completedCount, icon: CheckCircle2 },
                            { label: "Raised", value: formatMoney(totalRaised), icon: Heart },
                            { label: "Portfolio target", value: totalGoal > 0 ? formatMoney(totalGoal) : "Open", icon: Target },
                        ].map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                    <div className="grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                        <Icon size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        {projectsLoading ? <SkeletonBlock className="h-7 w-24 bg-primary-content/20" /> : <p className="truncate text-2xl font-bold">{stat.value}</p>}
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/55">{stat.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            <section id="projects" className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Project portfolio</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-tight text-primary md:text-5xl">
                                    School support workstreams with visible progress.
                                </h2>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-base-content/60">
                                    Search the project ledger, filter by status, and open each initiative for milestones, gallery images, and donation context.
                                </p>
                            </div>

                            <div className="border border-base-300 bg-base-100 p-3 shadow-sm">
                                <label className="flex items-center gap-3 bg-base-200 px-4 py-3 text-base-content/60">
                                    <Search size={18} className="text-secondary" />
                                    <input
                                        type="text"
                                        placeholder="Search projects"
                                        className="w-full bg-transparent text-sm font-semibold text-primary outline-none placeholder:text-base-content/45"
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(event.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    </ScrollReveal>

                    <div className="mb-8 flex flex-col gap-4 border-y border-base-300 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {statusFilters.map((filter) => (
                                <button
                                    key={filter}
                                    type="button"
                                    className={`btn btn-sm ${status === filter ? "btn-primary" : "btn-ghost"}`}
                                    onClick={() => {
                                        setStatus(filter);
                                        setPage(1);
                                    }}
                                >
                                    {filter === "ALL" ? "All" : formatStatus(filter)}
                                </button>
                            ))}
                        </div>
                        {projectsLoading ? (
                            <SkeletonBlock className="h-4 w-36 bg-primary/10" />
                        ) : (
                            <p className="text-sm font-semibold text-base-content/50">
                                {filtered.length} project{filtered.length === 1 ? "" : "s"} shown
                            </p>
                        )}
                    </div>

                    {projectsLoading ? (
                        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                            <div className="min-h-[440px] animate-pulse bg-base-100" />
                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">
                                <div className="h-52 animate-pulse bg-base-100" />
                                <div className="h-52 animate-pulse bg-base-100" />
                            </div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={<FolderOpen size={40} />}
                            title="No projects found"
                            description="No project currently matches those filters. Clear the search or choose another status to keep browsing."
                            action={
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setSearch("");
                                        setStatus("ALL");
                                        setPage(1);
                                    }}
                                >
                                    Clear filters
                                </button>
                            }
                        />
                    ) : (
                        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                            {featuredProject && (
                                <ScrollReveal>
                                    <Link to={`/projects/${featuredProject.slug}`} className="group block h-full overflow-hidden border border-primary/15 bg-base-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                                        <div className="relative min-h-[260px] overflow-hidden bg-primary md:min-h-[360px]">
                                            <ProjectImage src={featuredProject.imageUrl} title={featuredProject.title} className="h-full min-h-[260px] w-full md:min-h-[360px]" />
                                            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                                                <StatusPill status={featuredProject.status} />
                                                {featuredProject.isFeatured && <StatusPill status="FEATURED" />}
                                            </div>
                                        </div>
                                        <div className="p-6 md:p-8">
                                            <div className="mb-4 flex items-center justify-between gap-4">
                                                <p className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">Featured workstream</p>
                                                <ArrowRight size={20} className="text-base-content/30 transition group-hover:translate-x-1 group-hover:text-secondary" />
                                            </div>
                                            <h3 className="text-3xl font-bold leading-tight text-primary md:text-4xl">{featuredProject.title}</h3>
                                            <p className="mt-4 line-clamp-3 text-base leading-relaxed text-base-content/60">{featuredProject.description}</p>
                                            <div className="mt-7">
                                                <ProjectProgress project={featuredProject} />
                                            </div>
                                            <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-base-content/50">
                                                {formatDate(featuredProject.startDate) && (
                                                    <span className="flex items-center gap-2">
                                                        <Calendar size={15} className="text-secondary" />
                                                        Started {formatDate(featuredProject.startDate)}
                                                    </span>
                                                )}
                                                {(featuredProject.milestones?.length || 0) > 0 && (
                                                    <span className="flex items-center gap-2">
                                                        <CheckCircle2 size={15} className="text-secondary" />
                                                        {featuredProject.milestones?.filter((milestone) => milestone.completed).length}/{featuredProject.milestones?.length} milestones
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </ScrollReveal>
                            )}

                            <StaggerChildren className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">
                                {secondaryProjects.map((project) => (
                                    <Link
                                        key={project.id}
                                        to={`/projects/${project.slug}`}
                                        className="group grid overflow-hidden border border-base-300 bg-base-100 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl sm:grid-cols-[170px_1fr]"
                                    >
                                        <ProjectImage src={project.imageUrl} title={project.title} className="h-44 w-full sm:h-full" />
                                        <div className="p-5">
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <StatusPill status={project.status} />
                                                <ChevronRight size={18} className="text-base-content/25 transition group-hover:translate-x-1 group-hover:text-secondary" />
                                            </div>
                                            <h3 className="line-clamp-2 text-xl font-bold leading-tight text-primary">{project.title}</h3>
                                            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-base-content/60">{project.description}</p>
                                            <div className="mt-5">
                                                <ProjectProgress project={project} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </StaggerChildren>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-2">
                            <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                disabled={page === 1}
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                aria-label="Previous project page"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: totalPages }, (_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className={`btn btn-sm ${page === index + 1 ? "btn-primary" : "btn-ghost"}`}
                                    onClick={() => setPage(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                disabled={page === totalPages}
                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                aria-label="Next project page"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <section id="nsmq" className="overflow-hidden bg-base-100 py-16 md:py-24">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
                    <ScrollReveal direction="right">
                        <div className="sticky top-24">
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">NSMQ support lane</p>
                            <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">
                                Backing the school team beyond applause.
                            </h2>
                            <p className="mt-5 leading-relaxed text-base-content/60">
                                UPOSA supports the National Science and Maths Quiz team with coaching, alumni mentors, prep workshops, and targeted fundraising.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link to="/donate" className="btn btn-primary">
                                    Support NSMQ <ArrowRight size={16} />
                                </Link>
                                <Link to="/community" className="btn btn-ghost">
                                    Find mentors
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>

                    <div className="grid gap-4">
                        {[
                            {
                                title: "Regional preparation",
                                description: "Quiz prep sessions, mock contests, and alumni check-ins help the team sharpen before competitions.",
                                icon: Trophy,
                            },
                            {
                                title: "STEM professional network",
                                description: "Former contestants and science professionals can volunteer as mentors for current students.",
                                icon: Users,
                            },
                            {
                                title: "Targeted fundraising",
                                description: "Dedicated giving helps cover materials, logistics, and morale-building programs for the team.",
                                icon: Target,
                            },
                        ].map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <ScrollReveal key={item.title} delay={index * 0.08}>
                                    <div className="grid gap-5 border border-base-300 bg-base-200 p-5 md:grid-cols-[72px_1fr]">
                                        <div className="grid h-16 w-16 place-items-center bg-secondary text-secondary-content">
                                            <Icon size={28} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">0{index + 1}</p>
                                            <h3 className="mt-2 text-2xl font-bold text-primary">{item.title}</h3>
                                            <p className="mt-3 leading-relaxed text-base-content/60">{item.description}</p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="bg-primary text-primary-content">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                    <ScrollReveal>
                        <div>
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">How to support</p>
                            <h2 className="text-4xl font-bold leading-tight md:text-5xl">Choose the kind of help you can sustain.</h2>
                            <p className="mt-5 max-w-2xl leading-relaxed text-primary-content/60">
                                Projects move faster when alumni contribute money, time, expertise, or reach. Every support path leads back to the school.
                            </p>
                        </div>
                    </ScrollReveal>

                    <StaggerChildren className="grid gap-4 md:grid-cols-3">
                        {[
                            { title: "Volunteer", description: "Give your time and professional skills to project teams.", icon: HandHeart },
                            { title: "Donate", description: "Fund priority needs and track visible progress.", icon: Heart },
                            { title: "Spread awareness", description: "Bring more year groups and alumni into the work.", icon: Megaphone },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="border border-primary-content/10 bg-primary-content/10 p-5">
                                    <div className="mb-5 grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                        <Icon size={22} />
                                    </div>
                                    <h3 className="text-xl font-bold">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-primary-content/55">{item.description}</p>
                                </div>
                            );
                        })}
                    </StaggerChildren>

                    <div className="lg:col-span-2">
                        <Link to="/donate" className="btn btn-secondary btn-lg">
                            Make a donation <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Projects;
