import { ParallaxImg } from "../components/common/Parallax.tsx";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    MapPin,
    Search,
    Ticket,
    Users,
    X,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import { rsvpToEvent } from "../api/client.ts";
import SplashScreen from "../components/common/SplashScreen.tsx";
import EmptyState from "../components/common/EmptyState.tsx";
import { SkeletonBlock, SkeletonCardGrid } from "../components/common/Skeleton.tsx";
import { BouncingDots } from "../components/common/BouncingDots.tsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const PER_PAGE = 4;

type EventStatusFilter = "ALL" | "UPCOMING" | "ONGOING" | "PAST";

type EventItem = {
    id: string;
    title: string;
    slug?: string;
    description: string;
    imageUrl?: string | null;
    date: string;
    endDate?: string | null;
    location?: string | null;
    status?: string;
    isFeatured?: boolean;
    rsvpLink?: string | null;
};

type EventsResponse = {
    data?: EventItem[];
};

function getEventDate(date?: string | null) {
    const value = date ? new Date(date) : new Date();
    return Number.isNaN(value.getTime()) ? new Date() : value;
}

function formatLongDate(date?: string | null) {
    return getEventDate(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatMonth(date?: string | null) {
    return getEventDate(date).toLocaleDateString("en-US", { month: "short" });
}

function formatStatus(event: EventItem) {
    if (event.status) {
        return event.status
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    const now = new Date();
    const starts = getEventDate(event.date);
    const ends = event.endDate ? getEventDate(event.endDate) : starts;
    if (starts <= now && ends >= now) return "Ongoing";
    return ends < now ? "Past" : "Upcoming";
}

function eventMatchesStatus(event: EventItem, status: EventStatusFilter) {
    if (status === "ALL") return true;

    const now = new Date();
    const starts = getEventDate(event.date);
    const ends = event.endDate ? getEventDate(event.endDate) : starts;

    if (status === "UPCOMING") return starts >= now;
    if (status === "ONGOING") return starts <= now && ends >= now;
    return ends < now;
}

function EventDateBlock({ event }: { event: EventItem }) {
    return (
        <div className="flex min-w-[74px] flex-col items-center bg-primary px-4 py-3 text-center text-primary-content">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">{formatMonth(event.date)}</span>
            <span className="text-4xl font-bold leading-none">{getEventDate(event.date).getDate()}</span>
        </div>
    );
}

function EventImage({ event, className = "" }: { event: EventItem; className?: string }) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = Boolean(event.imageUrl) && !imageFailed;

    return (
        <div className={`relative overflow-hidden bg-primary ${className}`}>
            {showImage ? (
                <img
                    src={event.imageUrl || ""}
                    alt={event.title}
                    loading="lazy"
                    onError={() => setImageFailed(true)}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
            ) : (
                <div className="flex h-full min-h-60 flex-col items-center justify-center bg-primary p-8 text-center text-primary-content">
                    <img src="/logo.png" alt="" aria-hidden="true" className="mb-5 h-20 w-20 bg-base-100 object-contain p-2 opacity-90" />
                    <Calendar size={34} className="text-secondary" />
                </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
    );
}

function EventMeta({ event, light = false }: { event: EventItem; light?: boolean }) {
    const tone = light ? "text-primary-content/65" : "text-base-content/60";
    const endDate = event.endDate ? formatLongDate(event.endDate) : null;
    const dateRange = endDate && endDate !== formatLongDate(event.date)
        ? `${formatLongDate(event.date)} - ${endDate}`
        : formatLongDate(event.date);

    return (
        <div className={`flex flex-wrap gap-3 text-sm ${tone}`}>
            <span className="inline-flex items-center gap-1.5">
                <Calendar size={15} />
                {dateRange}
            </span>
            {event.location && (
                <span className="inline-flex items-center gap-1.5">
                    <MapPin size={15} />
                    {event.location}
                </span>
            )}
        </div>
    );
}

const Events = () => {
    const { data, loading } = useSiteData();
    const [allEvents, setAllEvents] = useState<EventItem[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [status, setStatus] = useState<EventStatusFilter>("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [rsvpEvent, setRsvpEvent] = useState<EventItem | null>(null);
    const [rsvpSubmitted, setRsvpSubmitted] = useState<Set<string>>(new Set());
    const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [rsvpError, setRsvpError] = useState("");

    useEffect(() => {
        setEventsLoading(true);
        fetch(`${API_BASE}/events`)
            .then(async (response) => response.json() as Promise<EventsResponse>)
            .then((json) => setAllEvents(Array.isArray(json.data) ? json.data : []))
            .catch(() => setAllEvents(data?.upcomingEvents || []))
            .finally(() => setEventsLoading(false));
    }, [data]);

    useEffect(() => {
        if (rsvpModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [rsvpModalOpen]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return allEvents.filter((event) => {
            const matchesStatus = eventMatchesStatus(event, status);
            const matchesSearch = !query
                || event.title.toLowerCase().includes(query)
                || event.description.toLowerCase().includes(query)
                || (event.location || "").toLowerCase().includes(query);
            return matchesStatus && matchesSearch;
        });
    }, [allEvents, search, status]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const featuredEvent = paginated.find((event) => event.isFeatured) || paginated[0];
    const secondaryEvents = paginated.filter((event) => event.id !== featuredEvent?.id);
    const upcomingCount = allEvents.filter((event) => eventMatchesStatus(event, "UPCOMING")).length;
    const pastCount = allEvents.filter((event) => eventMatchesStatus(event, "PAST")).length;

    const openRsvp = (event: EventItem) => {
        setRsvpEvent(event);
        setRsvpModalOpen(true);
        setRsvpError("");
    };

    const closeRsvp = () => {
        setRsvpModalOpen(false);
        setRsvpEvent(null);
    };

    const submitRsvp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!rsvpEvent) return;

        setRsvpLoading(true);
        setRsvpError("");
        const formData = new FormData(event.currentTarget);

        try {
            await rsvpToEvent(rsvpEvent.id, {
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                phone: (formData.get("phone") as string) || undefined,
            });
            setRsvpSubmitted((current) => new Set(current).add(rsvpEvent.id));
        } catch (err) {
            setRsvpError(err instanceof Error ? err.message : "Failed to RSVP");
        } finally {
            setRsvpLoading(false);
        }
    };

    if (loading || !data) {
        return <SplashScreen />;
    }

    const statusFilters: EventStatusFilter[] = ["ALL", "UPCOMING", "ONGOING", "PAST"];

    return (
        <Layout>
            <SEO
                title="Events"
                description="Discover upcoming UPOSA events, reunions, and alumni gatherings. RSVP and stay connected with University Practice SHS alumni."
                canonicalPath="/events"
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
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Events desk</p>
                                    <p className="text-sm font-semibold text-primary/70">Reunions, meetings, and alumni gatherings</p>
                                </div>
                            </div>

                            <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                                <Ticket size={16} />
                                Gatherings and RSVP
                            </p>
                            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] md:text-7xl">
                                Events that bring old students back into the room.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                Follow upcoming reunions, alumni meetings, fundraising gatherings, and school-facing events from the UPOSA calendar.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <a href="#calendar" className="btn btn-primary btn-lg">
                                    Browse calendar <ArrowRight size={18} />
                                </a>
                                <a href="#calendar" className="btn btn-secondary btn-lg">
                                    RSVP now
                                </a>
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Calendar status</p>
                                        <h2 className="mt-3 text-2xl font-bold">Upcoming, ongoing, and past events in one view.</h2>
                                    </div>
                                    <Calendar className="text-secondary" size={34} />
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    <div className="border border-primary-content/10 bg-primary-content/10 p-4">
                                        <p className="text-3xl font-bold">{allEvents.length}</p>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/55">Events</p>
                                    </div>
                                    <div className="border border-primary-content/10 bg-primary-content/10 p-4">
                                        <p className="text-3xl font-bold">{upcomingCount}</p>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/55">Upcoming</p>
                                    </div>
                                </div>

                                {featuredEvent && (
                                    <div className="mt-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Next up</p>
                                        <p className="mt-2 line-clamp-2 font-bold text-primary-content/85">{featuredEvent.title}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="bg-primary text-primary-content">
                <div className="mx-auto max-w-7xl px-4 py-6">
                    <StaggerChildren className="grid gap-3 md:grid-cols-3">
                        {[
                            { label: "Total events", value: allEvents.length, icon: Calendar },
                            { label: "Upcoming", value: upcomingCount, icon: Ticket },
                            { label: "Past gatherings", value: pastCount, icon: Users },
                        ].map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                    <div className="grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                        <Icon size={22} />
                                    </div>
                                    <div>
                                        {eventsLoading ? <SkeletonBlock className="h-7 w-14 bg-primary-content/20" /> : <p className="text-2xl font-bold">{stat.value}</p>}
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/55">{stat.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            <section id="calendar" className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Events calendar</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-tight text-primary md:text-5xl">Gatherings, reunions, and public calls.</h2>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-base-content/60">
                                    Filter the calendar by event timing or search for a gathering by title, description, or location.
                                </p>
                            </div>
                            <div className="border border-primary/10 bg-base-100 p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-11 w-11 place-items-center bg-secondary text-secondary-content">
                                        <Search size={19} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Showing</p>
                                        <p className="font-bold text-primary">{filtered.length} of {allEvents.length} events</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div className="mb-8 grid gap-4 border-y border-primary/10 py-4 lg:grid-cols-[1fr_320px] lg:items-center">
                            <div className="flex flex-wrap gap-2">
                                {statusFilters.map((filter) => (
                                    <button
                                        key={filter}
                                        type="button"
                                        className={`border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${status === filter
                                            ? "border-primary bg-primary text-primary-content shadow-sm"
                                            : "border-primary/15 bg-base-100 text-primary hover:border-secondary hover:text-secondary"
                                        }`}
                                        onClick={() => {
                                            setStatus(filter);
                                            setPage(1);
                                        }}
                                    >
                                        {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                            <label className="relative block">
                                <span className="sr-only">Search events</span>
                                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/35" />
                                <input
                                    type="search"
                                    placeholder="Search events..."
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

                    {eventsLoading ? (
                        <SkeletonCardGrid count={3} />
                    ) : featuredEvent ? (
                        <>
                            <ScrollReveal>
                                <div className="group grid overflow-hidden border border-primary/10 bg-base-100 shadow-sm lg:grid-cols-[0.92fr_1.08fr]">
                                    <EventImage event={featuredEvent} className="min-h-[320px] lg:min-h-[460px]" />
                                    <div className="flex flex-col p-6 md:p-8">
                                        <div className="mb-8 flex flex-wrap items-center gap-4">
                                            <EventDateBlock event={featuredEvent} />
                                            <div>
                                                <span className="inline-flex bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-secondary-content">
                                                    {formatStatus(featuredEvent)}
                                                </span>
                                                <div className="mt-3">
                                                    <EventMeta event={featuredEvent} />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-secondary">Featured event</p>
                                        <h3 className="text-3xl font-bold leading-tight text-primary md:text-5xl">{featuredEvent.title}</h3>
                                        <p className="mt-5 line-clamp-4 text-base leading-relaxed text-base-content/60">{featuredEvent.description}</p>
                                        <div className="mt-auto flex flex-wrap gap-3 pt-8">
                                            {featuredEvent.rsvpLink ? (
                                                <a href={featuredEvent.rsvpLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                                    RSVP externally <ExternalLink size={17} />
                                                </a>
                                            ) : rsvpSubmitted.has(featuredEvent.id) ? (
                                                <span className="btn btn-success no-animation">
                                                    <CheckCircle2 size={17} /> RSVP confirmed
                                                </span>
                                            ) : (
                                                <button className="btn btn-primary" onClick={() => openRsvp(featuredEvent)}>
                                                    RSVP now <ArrowRight size={17} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>

                            {secondaryEvents.length > 0 && (
                                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                                    {secondaryEvents.map((event, index) => (
                                        <ScrollReveal key={event.id} delay={index * 0.06}>
                                            <div className="group h-full border border-primary/10 bg-base-100 p-5 shadow-sm transition-all hover:border-secondary/60 hover:shadow-lg">
                                                <div className="flex flex-col gap-5 sm:flex-row">
                                                    <div className="sm:w-40">
                                                        <EventImage event={event} className="h-40 sm:h-full" />
                                                    </div>
                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                        <div className="mb-4 flex items-start gap-4">
                                                            <EventDateBlock event={event} />
                                                            <div className="min-w-0">
                                                                <span className="inline-flex bg-base-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-secondary">
                                                                    {formatStatus(event)}
                                                                </span>
                                                                <h3 className="mt-3 text-xl font-bold leading-tight text-primary">{event.title}</h3>
                                                            </div>
                                                        </div>
                                                        <EventMeta event={event} />
                                                        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-base-content/60">{event.description}</p>
                                                        <div className="mt-auto pt-5">
                                                            {event.rsvpLink ? (
                                                                <a href={event.rsvpLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                                                                    RSVP externally <ExternalLink size={14} />
                                                                </a>
                                                            ) : rsvpSubmitted.has(event.id) ? (
                                                                <span className="btn btn-success btn-sm no-animation">
                                                                    <CheckCircle2 size={14} /> RSVP confirmed
                                                                </span>
                                                            ) : (
                                                                <button className="btn btn-primary btn-sm" onClick={() => openRsvp(event)}>
                                                                    RSVP now
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </ScrollReveal>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <EmptyState
                            icon={<Calendar />}
                            title={search || status !== "ALL" ? "No events match this view." : "No events found."}
                            description={search || status !== "ALL"
                                ? "Try another keyword or clear the timing filter to keep browsing."
                                : "We're planning something exciting. Check back soon for reunions and alumni gatherings."
                            }
                            action={(search || status !== "ALL") && (
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

            <AnimatePresence>
                {rsvpModalOpen && rsvpEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                        onClick={closeRsvp}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 18 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 18 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-2xl overflow-hidden border border-primary/10 bg-base-100 shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-4 border-b border-primary/10 bg-primary p-5 text-primary-content">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                                        {rsvpSubmitted.has(rsvpEvent.id) ? "Registration confirmed" : "Event RSVP"}
                                    </p>
                                    <h3 className="mt-2 text-2xl font-bold">{rsvpEvent.title}</h3>
                                </div>
                                <button className="btn btn-ghost btn-sm btn-circle bg-primary-content/10 text-primary-content hover:bg-primary-content hover:text-primary" onClick={closeRsvp} aria-label="Close RSVP modal">
                                    <X size={18} />
                                </button>
                            </div>

                            {rsvpSubmitted.has(rsvpEvent.id) ? (
                                <div className="p-8 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                        className="mx-auto mb-6 grid h-20 w-20 place-items-center bg-success/10"
                                    >
                                        <CheckCircle2 size={46} className="text-success" />
                                    </motion.div>
                                    <h4 className="text-2xl font-bold text-primary">RSVP confirmed.</h4>
                                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-base-content/60">
                                        You are registered for <strong>{rsvpEvent.title}</strong>. We will send a reminder to your email before the event.
                                    </p>
                                    <button className="btn btn-primary mt-7" onClick={closeRsvp}>Close</button>
                                </div>
                            ) : (
                                <div className="grid gap-0 md:grid-cols-[0.85fr_1fr]">
                                    <div className="bg-base-200 p-5">
                                        <div className="mb-5 flex items-center gap-4">
                                            <EventDateBlock event={rsvpEvent} />
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">{formatStatus(rsvpEvent)}</p>
                                                <p className="mt-1 font-bold text-primary">{formatLongDate(rsvpEvent.date)}</p>
                                            </div>
                                        </div>
                                        <EventMeta event={rsvpEvent} />
                                        <p className="mt-5 text-sm leading-relaxed text-base-content/60">{rsvpEvent.description}</p>
                                    </div>

                                    <form className="space-y-4 p-5" onSubmit={submitRsvp}>
                                        <div>
                                            <label className="label pb-1"><span className="label-text font-semibold text-primary">Full name *</span></label>
                                            <input name="name" type="text" placeholder="Your name" className="input input-bordered w-full border-primary/15 bg-base-100 focus:border-secondary" required />
                                        </div>
                                        <div>
                                            <label className="label pb-1"><span className="label-text font-semibold text-primary">Email *</span></label>
                                            <input name="email" type="email" placeholder="you@example.com" className="input input-bordered w-full border-primary/15 bg-base-100 focus:border-secondary" required />
                                        </div>
                                        <div>
                                            <label className="label pb-1"><span className="label-text font-semibold text-primary">Phone</span></label>
                                            <input name="phone" type="tel" placeholder="+233 XX XXX XXXX" className="input input-bordered w-full border-primary/15 bg-base-100 focus:border-secondary" />
                                        </div>
                                        {rsvpError && <p className="border border-error/20 bg-error/10 p-3 text-sm font-semibold text-error">{rsvpError}</p>}
                                        <button type="submit" className="btn btn-primary h-12 w-full" disabled={rsvpLoading}>
                                            {rsvpLoading ? <BouncingDots /> : "Confirm RSVP"}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default Events;
