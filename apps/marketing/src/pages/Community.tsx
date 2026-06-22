import { ParallaxImg } from "../components/common/Parallax.tsx";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Briefcase,
    CheckCircle2,
    ChevronDown,
    ExternalLink,
    Handshake,
    Mail,
    MessageSquare,
    Search,
    Sparkles,
    ThumbsUp,
    UserPlus,
    Users,
    Vote,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import EmptyState from "../components/common/EmptyState.tsx";
import { SkeletonBlock, SkeletonCardGrid, SkeletonRows } from "../components/common/Skeleton.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

type ApiListResponse<T> = {
    data?: T[];
};

type MentorApi = {
    fullName?: string;
    areaOfExpertise?: string[];
    yearGroup?: number | string;
    isAvailableAsMentor?: boolean;
};

type JobApi = {
    title?: string;
    company?: string;
    location?: string;
    jobType?: string;
    createdAt?: string;
    externalUrl?: string;
    contactEmail?: string;
    postedBy?: { fullName?: string } | null;
};

type DiscussionApi = {
    id?: string | number;
    title?: string;
    updatedAt?: string;
    viewCount?: number;
    author?: { fullName?: string } | null;
    _count?: { comments?: number };
};

type PollOptionApi = string | {
    text?: string;
    votes?: number;
};

type PollApi = {
    id?: string | number;
    question?: string;
    options?: PollOptionApi[];
    endsAt?: string;
};

type ElectionApi = {
    position?: string;
    title?: string;
    status?: string;
    endDate?: string;
    candidates?: Array<string | { name?: string }>;
};

type Mentor = {
    name: string;
    field: string;
    year: string;
    available: boolean;
};

type Job = {
    title: string;
    company: string;
    location: string;
    type: string;
    posted: string;
    postedBy: string;
    url: string;
};

type Discussion = {
    id: string;
    title: string;
    author: string;
    replies: number;
    lastActive: string;
};

type PollOption = {
    text: string;
    votes: number;
};

type Poll = {
    id: string;
    question: string;
    options: PollOption[];
    totalVoters: number;
    endsIn: string;
};

type Election = {
    position: string;
    candidates: string[];
    status: string;
    endsIn: string;
};

type CommunityTab = "forum" | "polls" | "elections" | null;

function timeAgo(dateStr?: string): string {
    if (!dateStr) return "Open";

    const then = new Date(dateStr).getTime();
    if (Number.isNaN(then)) return "Open";

    const diff = Math.abs(Date.now() - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;

    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;

    return `${Math.floor(days / 30)}mo ago`;
}

async function fetchCommunityCollection<T>(path: string): Promise<T[]> {
    const response = await fetch(`${API_BASE}${path}`);
    const json = await response.json() as ApiListResponse<T>;
    return Array.isArray(json.data) ? json.data : [];
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function normalisePollOption(option: PollOptionApi): PollOption {
    if (typeof option === "string") {
        return { text: option, votes: 0 };
    }

    return {
        text: option.text || "Option",
        votes: option.votes || 0,
    };
}

const Community = () => {
    const { data, loading } = useSiteData();
    const [activeTab, setActiveTab] = useState<CommunityTab>("forum");
    const [communityLoading, setCommunityLoading] = useState(true);
    const [votedPolls, setVotedPolls] = useState<Record<string, number>>({});
    const [votedElections, setVotedElections] = useState<Record<string, number>>({});
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [elections, setElections] = useState<Election[]>([]);
    const expandedRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;

        Promise.allSettled([
            fetchCommunityCollection<MentorApi>("/mentorship/mentors"),
            fetchCommunityCollection<JobApi>("/jobs"),
            fetchCommunityCollection<DiscussionApi>("/forum/posts"),
            fetchCommunityCollection<PollApi>("/polls"),
            fetchCommunityCollection<ElectionApi>("/elections"),
        ]).then(([mentorRes, jobRes, forumRes, pollRes, electionRes]) => {
            if (!isMounted) return;

            if (mentorRes.status === "fulfilled") {
                setMentors(mentorRes.value.map((mentor) => ({
                    name: mentor.fullName || "UPOSA mentor",
                    field: mentor.areaOfExpertise?.filter(Boolean).join(", ") || "General guidance",
                    year: mentor.yearGroup ? `Class of ${mentor.yearGroup}` : "UPOSA alumnus",
                    available: Boolean(mentor.isAvailableAsMentor),
                })));
            }

            if (jobRes.status === "fulfilled") {
                setJobs(jobRes.value.map((job) => ({
                    title: job.title || "Opportunity",
                    company: job.company || "UPOSA network",
                    location: job.location || "Remote / Ghana",
                    type: job.jobType?.replace("_", "-") || "Opportunity",
                    posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recently",
                    postedBy: job.postedBy?.fullName || "UPOSA",
                    url: job.externalUrl || (job.contactEmail ? `mailto:${job.contactEmail}` : "#"),
                })));
            }

            if (forumRes.status === "fulfilled") {
                setDiscussions(forumRes.value.map((discussion) => ({
                    id: String(discussion.id || discussion.title || "discussion"),
                    title: discussion.title || "Community discussion",
                    author: discussion.author?.fullName || "Alumni",
                    replies: discussion._count?.comments || discussion.viewCount || 0,
                    lastActive: timeAgo(discussion.updatedAt),
                })));
            }

            if (pollRes.status === "fulfilled") {
                setPolls(pollRes.value.map((poll) => {
                    const options = (poll.options || []).map(normalisePollOption);
                    const totalVoters = options.reduce((sum, option) => sum + option.votes, 0);
                    const question = poll.question || "Community poll";

                    return {
                        id: String(poll.id || question),
                        question,
                        options,
                        totalVoters,
                        endsIn: poll.endsAt ? timeAgo(poll.endsAt) : "Open",
                    };
                }));
            }

            if (electionRes.status === "fulfilled") {
                setElections(electionRes.value.map((election) => ({
                    position: election.position || election.title || "Election",
                    candidates: (election.candidates || []).map((candidate) => typeof candidate === "string" ? candidate : candidate.name || "Candidate"),
                    status: election.status === "ACTIVE" ? "Voting Open" : election.status || "Scheduled",
                    endsIn: election.endDate ? timeAgo(election.endDate) : "Open",
                })));
            }
        }).finally(() => {
            if (isMounted) setCommunityLoading(false);
        });

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading || !data) {
        return <SplashScreen />;
    }

    const stats = data.config.stats;
    const quickLinks = [
        { title: "Mentorship", description: "Find available alumni guides.", href: "#mentorship", icon: Handshake },
        { title: "Jobs", description: "Browse alumni-posted openings.", href: "#jobs", icon: Briefcase },
        { title: "Forum", description: "Join current discussions.", href: "#forum", icon: MessageSquare },
        { title: "Voting", description: "Follow polls and elections.", href: "#civic", icon: Vote },
    ];

    const heroStats = [
        { label: "Registered alumni", value: `${stats.members.toLocaleString()}+`, icon: Users },
        { label: "Mentors listed", value: String(mentors.length), loading: communityLoading, icon: Handshake },
        { label: "Open opportunities", value: String(jobs.length), loading: communityLoading, icon: Briefcase },
    ];

    const forumCards = [
        { id: "forum" as const, title: "Discussion forum", description: "Share ideas, questions, and updates with old students.", action: activeTab === "forum" ? "Hide" : "Open forum", icon: MessageSquare },
        { id: "polls" as const, title: "Polls and surveys", description: "Take quick votes that help shape association priorities.", action: activeTab === "polls" ? "Hide" : "View polls", icon: ThumbsUp },
        { id: "elections" as const, title: "Elections", description: "Participate in executive voting when ballots are active.", action: activeTab === "elections" ? "Hide" : "View elections", icon: Vote },
    ];

    const toggleTab = (tab: Exclude<CommunityTab, null>) => {
        const isOpening = activeTab !== tab;
        setActiveTab((current) => current === tab ? null : tab);

        if (isOpening) {
            setTimeout(() => {
                expandedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 250);
        }
    };

    const votePoll = (pollId: string, optionIdx: number) => {
        if (votedPolls[pollId] !== undefined) return;
        setVotedPolls((current) => ({ ...current, [pollId]: optionIdx }));
    };

    const voteElection = (position: string, candidateIdx: number) => {
        if (votedElections[position] !== undefined) return;
        setVotedElections((current) => ({ ...current, [position]: candidateIdx }));
    };

    return (
        <Layout>
            <SEO
                title="Community"
                description="Join the UPOSA community through mentorship, job opportunities, discussions, polls, and elections."
                canonicalPath="/community"
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

                <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1fr_430px] lg:items-center">
                    <HeroReveal>
                        <div className="max-w-4xl">
                            <div className="mb-8 inline-flex items-center gap-3 border border-primary/15 bg-base-200 px-4 py-2">
                                <img src="/logo.png" alt="UPOSA crest" className="h-10 w-10 bg-base-100 object-contain p-1" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Community desk</p>
                                    <p className="text-sm font-semibold text-primary/70">Mentors, jobs, forum, and votes</p>
                                </div>
                            </div>

                            <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                                <Sparkles size={16} />
                                Alumni connection
                            </p>
                            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] md:text-7xl">
                                The working room for UPOSA people and opportunities.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                Connect with mentors, share opportunities, join community conversations, and take part in polls and elections that move the association forward.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <a href="#mentorship" className="btn btn-primary btn-lg">
                                    Find mentors <ArrowRight size={18} />
                                </a>
                                <a href="#jobs" className="btn btn-secondary btn-lg">
                                    See opportunities
                                </a>
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Community lanes</p>
                                        <h2 className="mt-3 text-2xl font-bold">Four ways to stay useful to each other.</h2>
                                    </div>
                                    <Users className="text-secondary" size={34} />
                                </div>

                                <div className="mt-8 space-y-3">
                                    {quickLinks.map((link) => {
                                        const Icon = link.icon;
                                        return (
                                            <a key={link.title} href={link.href} className="group flex items-center gap-3 border border-primary-content/10 bg-primary-content/10 p-3 transition-colors hover:border-secondary/60">
                                                <div className="grid h-10 w-10 place-items-center bg-secondary text-secondary-content">
                                                    <Icon size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold">{link.title}</p>
                                                    <p className="text-sm text-primary-content/55">{link.description}</p>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="bg-primary text-primary-content">
                <div className="mx-auto max-w-7xl px-4 py-6">
                    <StaggerChildren className="grid gap-3 md:grid-cols-3">
                        {heroStats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                    <div className="grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                        <Icon size={22} />
                                    </div>
                                    <div>
                                        {stat.loading ? <SkeletonBlock className="h-7 w-14 bg-primary-content/20" /> : <p className="text-2xl font-bold">{stat.value}</p>}
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/55">{stat.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            <section id="mentorship" className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Mentorship and networking</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-tight text-primary md:text-5xl">Experienced old students, reachable by the next class.</h2>
                                <p className="mt-4 max-w-2xl leading-relaxed text-base-content/60">
                                    Mentor profiles are drawn from alumni who opt in to support students, graduates, and younger alumni.
                                </p>
                            </div>
                            <Handshake size={42} className="text-secondary" />
                        </div>
                    </ScrollReveal>

                    {communityLoading ? (
                        <SkeletonCardGrid count={3} />
                    ) : mentors.length > 0 ? (
                        <StaggerChildren className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {mentors.map((mentor) => (
                                <div key={`${mentor.name}-${mentor.year}`} className="border border-primary/10 bg-base-100 p-5 shadow-sm">
                                    <div className="mb-6 flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="grid h-14 w-14 place-items-center bg-primary text-lg font-bold text-primary-content">
                                                {getInitials(mentor.name)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-primary">{mentor.name}</h3>
                                                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">{mentor.year}</p>
                                            </div>
                                        </div>
                                        <span className={`border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${mentor.available ? "border-success/30 bg-success/10 text-success" : "border-base-300 text-base-content/45"}`}>
                                            {mentor.available ? "Available" : "Unavailable"}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3 border-t border-primary/10 pt-4">
                                        <Search size={18} className="mt-0.5 text-secondary" />
                                        <p className="text-sm leading-relaxed text-base-content/65">{mentor.field}</p>
                                    </div>
                                    {mentor.available && (
                                        <Link to="/membership" className="btn btn-primary btn-sm mt-5 w-full">
                                            Request connection
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </StaggerChildren>
                    ) : (
                        <EmptyState
                            icon={<Handshake />}
                            title="Mentor profiles are coming soon."
                            description="Registered alumni can opt in from the membership desk."
                        />
                    )}

                    <ScrollReveal delay={0.2}>
                        <div className="mt-8 text-center">
                            <Link to="/membership" className="btn btn-secondary">
                                <UserPlus size={16} /> Become a mentor
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section id="jobs" className="bg-base-100 py-16 md:py-24">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[360px_1fr]">
                    <ScrollReveal>
                        <div className="border border-primary/10 bg-primary p-5 text-primary-content shadow-sm lg:sticky lg:top-28">
                            <Briefcase className="mb-8 text-secondary" size={42} />
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Jobs and opportunities</p>
                            <h2 className="text-4xl font-bold leading-tight">A noticeboard for work, internships, and referrals.</h2>
                            <p className="mt-5 leading-relaxed text-primary-content/65">
                                Alumni can share openings and useful opportunities for students, graduates, and professionals in the network.
                            </p>
                            <Link to="/contact?subject=Post a Job Opportunity" className="btn btn-secondary mt-8 w-full">
                                Post an opportunity
                            </Link>
                        </div>
                    </ScrollReveal>

                    <div className="space-y-4">
                        {communityLoading ? (
                            <SkeletonRows count={3} />
                        ) : jobs.length > 0 ? (
                            jobs.map((job, index) => (
                                <ScrollReveal key={`${job.title}-${job.company}`} delay={index * 0.05}>
                                    <div className="group border border-primary/10 bg-base-200 p-5 shadow-sm transition-all hover:border-secondary/60 hover:shadow-lg">
                                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="grid h-12 w-12 shrink-0 place-items-center bg-primary text-primary-content transition-colors group-hover:bg-secondary group-hover:text-secondary-content">
                                                    <Briefcase size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-primary">{job.title}</h3>
                                                    <p className="mt-1 text-sm text-base-content/60">{job.company} - {job.location}</p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <span className="border border-primary/10 bg-base-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">{job.type}</span>
                                                        <span className="border border-primary/10 bg-base-100 px-3 py-1 text-xs font-semibold text-base-content/50">{job.posted}</span>
                                                        <span className="border border-primary/10 bg-base-100 px-3 py-1 text-xs font-semibold text-base-content/50">By {job.postedBy}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm shrink-0">
                                                Apply <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))
                        ) : (
                            <EmptyState
                                icon={<Briefcase />}
                                title="No job listings yet."
                                description="The opportunity board will update as alumni submit openings."
                            />
                        )}
                    </div>
                </div>
            </section>

            <section id="civic" className="bg-primary py-16 text-primary-content md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Forum, polls, and elections</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">The civic room for association decisions.</h2>
                                <p className="mt-4 max-w-2xl leading-relaxed text-primary-content/65">
                                    Open a lane below to view discussions, vote in polls, or participate in active elections.
                                </p>
                            </div>
                            <MessageSquare size={42} className="text-secondary" />
                        </div>
                    </ScrollReveal>

                    <StaggerChildren className="grid gap-4 md:grid-cols-3">
                        {forumCards.map((card) => {
                            const Icon = card.icon;
                            const isActive = activeTab === card.id;
                            return (
                                <button
                                    key={card.id}
                                    type="button"
                                    className={`group border p-6 text-left transition-all ${isActive ? "border-secondary bg-secondary text-secondary-content" : "border-primary-content/10 bg-primary-content/10 hover:border-secondary/70"}`}
                                    onClick={() => toggleTab(card.id)}
                                >
                                    <div className="mb-8 flex items-start justify-between gap-4">
                                        <div className={`grid h-12 w-12 place-items-center ${isActive ? "bg-primary text-primary-content" : "bg-secondary text-secondary-content"}`}>
                                            <Icon size={24} />
                                        </div>
                                        <ChevronDown size={18} className={`transition-transform ${isActive ? "rotate-180 text-primary" : "text-primary-content/50"}`} />
                                    </div>
                                    <h3 className={`text-xl font-bold ${isActive ? "text-primary" : "text-primary-content"}`}>{card.title}</h3>
                                    <p className={`mt-3 text-sm leading-relaxed ${isActive ? "text-primary/70" : "text-primary-content/65"}`}>{card.description}</p>
                                    <p className={`mt-5 text-xs font-bold uppercase tracking-[0.16em] ${isActive ? "text-primary" : "text-secondary"}`}>{card.action}</p>
                                </button>
                            );
                        })}
                    </StaggerChildren>

                    <div ref={expandedRef} />
                    <AnimatePresence mode="wait">
                        {activeTab && (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="mt-8 border border-primary-content/10 bg-base-100 p-5 text-base-content shadow-2xl md:p-6">
                                    {activeTab === "forum" && (
                                        <div>
                                            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Recent discussions</p>
                                                    <h3 className="mt-2 text-2xl font-bold text-primary">Community topics</h3>
                                                </div>
                                                <a
                                                    href={`${import.meta.env.VITE_ALUMNI_URL || "https://alumni.uposa.org"}/forum`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    New topic
                                                </a>
                                            </div>
                                            <div className="space-y-3">
                                                {discussions.length > 0 ? discussions.map((discussion) => (
                                                    <div key={discussion.id} className="flex flex-col gap-4 border border-primary/10 bg-base-200 p-4 md:flex-row md:items-center md:justify-between">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <div className="grid h-11 w-11 shrink-0 place-items-center bg-secondary text-secondary-content">
                                                                <MessageSquare size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="truncate font-bold text-primary">{discussion.title}</h4>
                                                                <p className="mt-1 text-xs text-base-content/55">{discussion.author} - {discussion.lastActive}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-base-content/60">
                                                            <MessageSquare size={14} /> {discussion.replies} replies
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <EmptyState
                                                        icon={<MessageSquare />}
                                                        title="No discussions posted yet."
                                                        description="New community topics will appear here once alumni start a conversation."
                                                        className="min-h-[220px] py-10"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "polls" && (
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Active polls</p>
                                            <h3 className="mt-2 text-2xl font-bold text-primary">Vote on current questions</h3>
                                            <div className="mt-5 space-y-5">
                                                {polls.length > 0 ? polls.map((poll) => {
                                                    const hasVoted = votedPolls[poll.id] !== undefined;
                                                    return (
                                                        <div key={poll.id} className="border border-primary/10 bg-base-200 p-5">
                                                            <h4 className="font-bold text-primary">{poll.question}</h4>
                                                            <p className="mt-1 text-xs text-base-content/55">{poll.totalVoters} voters - Ends {poll.endsIn}</p>
                                                            <div className="mt-4 space-y-2">
                                                                {poll.options.map((option, index) => {
                                                                    const adjustedVotes = option.votes + (votedPolls[poll.id] === index ? 1 : 0);
                                                                    const adjustedTotal = poll.totalVoters + (hasVoted ? 1 : 0);
                                                                    const pct = adjustedTotal > 0 ? Math.round((adjustedVotes / adjustedTotal) * 100) : 0;

                                                                    return (
                                                                        <button
                                                                            key={option.text}
                                                                            type="button"
                                                                            className={`relative w-full overflow-hidden border p-3 text-left transition-colors ${hasVoted
                                                                                ? votedPolls[poll.id] === index
                                                                                    ? "border-primary bg-primary/10"
                                                                                    : "border-primary/10 bg-base-100"
                                                                                : "border-primary/10 bg-base-100 hover:border-secondary"
                                                                            }`}
                                                                            onClick={() => votePoll(poll.id, index)}
                                                                            disabled={hasVoted}
                                                                        >
                                                                            {hasVoted && (
                                                                                <div className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500" style={{ width: `${pct}%` }} />
                                                                            )}
                                                                            <div className="relative flex items-center justify-between gap-4">
                                                                                <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                                                                                    {votedPolls[poll.id] === index && <CheckCircle2 size={16} className="text-primary" />}
                                                                                    {option.text}
                                                                                </span>
                                                                                {hasVoted && <span className="text-xs font-bold text-primary">{pct}%</span>}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                }) : (
                                                    <EmptyState
                                                        icon={<ThumbsUp />}
                                                        title="No active polls yet."
                                                        description="Association polls will appear here when there is a question for members."
                                                        className="min-h-[220px] py-10"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "elections" && (
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Current elections</p>
                                            <h3 className="mt-2 text-2xl font-bold text-primary">Ballots and candidates</h3>
                                            <div className="mt-5 space-y-5">
                                                {elections.length > 0 ? elections.map((election) => {
                                                    const hasVoted = votedElections[election.position] !== undefined;
                                                    return (
                                                        <div key={election.position} className="border border-primary/10 bg-base-200 p-5">
                                                            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                                <h4 className="text-xl font-bold text-primary">{election.position}</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span className={`border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${election.status === "Voting Open" ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}>
                                                                        {election.status}
                                                                    </span>
                                                                    <span className="border border-primary/10 bg-base-100 px-3 py-1 text-xs font-semibold text-base-content/55">Ends {election.endsIn}</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {election.candidates.map((candidate, index) => (
                                                                    <div
                                                                        key={`${election.position}-${candidate}`}
                                                                        className={`flex items-center justify-between gap-3 border p-3 ${hasVoted && votedElections[election.position] === index ? "border-primary bg-primary/10" : "border-primary/10 bg-base-100"}`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="grid h-10 w-10 place-items-center bg-primary text-sm font-bold text-primary-content">
                                                                                {getInitials(candidate)}
                                                                            </div>
                                                                            <span className="text-sm font-bold text-primary">{candidate}</span>
                                                                        </div>
                                                                        {election.status === "Voting Open" && (
                                                                            hasVoted ? (
                                                                                votedElections[election.position] === index ? (
                                                                                    <span className="inline-flex items-center gap-1 bg-primary px-3 py-1 text-xs font-bold text-primary-content">
                                                                                        <CheckCircle2 size={12} /> Voted
                                                                                    </span>
                                                                                ) : null
                                                                            ) : (
                                                                                <button className="btn btn-primary btn-xs" onClick={() => voteElection(election.position, index)}>
                                                                                    Vote
                                                                                </button>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {hasVoted && (
                                                                <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-success">
                                                                    <CheckCircle2 size={14} /> Your vote has been recorded.
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }) : (
                                                    <EmptyState
                                                        icon={<Vote />}
                                                        title="No active elections yet."
                                                        description="Election ballots and candidate lists will appear here when voting opens."
                                                        className="min-h-[220px] py-10"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            <section className="bg-base-200 py-16">
                <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                        <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Contribute to the network</p>
                        <h2 className="text-3xl font-bold text-primary md:text-4xl">Share a role, mentor a student, or start a useful conversation.</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/membership" className="btn btn-primary">
                            Join as a member <ArrowRight size={18} />
                        </Link>
                        <Link to="/contact" className="btn btn-secondary">
                            <Mail size={18} /> Contact UPOSA
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Community;
