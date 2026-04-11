import { Layout } from "../components/layout/Layout.tsx";
import { Calendar, MapPin, Clock, X, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import HeroBanner from "../components/common/HeroBanner.tsx";
import SectionHeader from "../components/common/SectionHeader.tsx";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import { rsvpToEvent } from "../api/client.ts";
import SplashScreen from "../components/common/SplashScreen.tsx";
import EmptyState from "../components/common/EmptyState.tsx";
import StatusPill from "../components/common/StatusPill.tsx";
import { Card, CardAccent, CardBody, CardImage } from "../components/ui/Card.tsx";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Events = () => {
    const { data, loading } = useSiteData();
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [status, setStatus] = useState('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PER_PAGE = 4;
    const [rsvpEvent, setRsvpEvent] = useState<{ id: string; title: string } | null>(null);
    const [rsvpSubmitted, setRsvpSubmitted] = useState<Set<string>>(new Set());
    const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [rsvpError, setRsvpError] = useState('');

    const openRsvp = (eventId: string, eventTitle: string) => {
        setRsvpEvent({ id: eventId, title: eventTitle });
        setRsvpModalOpen(true);
        setRsvpError('');
    };

    const submitRsvp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rsvpEvent) return;
        setRsvpLoading(true);
        setRsvpError('');
        const fd = new FormData(e.currentTarget as HTMLFormElement);
        try {
            await rsvpToEvent(rsvpEvent.id, {
                name: fd.get('name') as string,
                email: fd.get('email') as string,
                phone: (fd.get('phone') as string) || undefined,
            });
            setRsvpSubmitted(prev => new Set(prev).add(rsvpEvent.title));
        } catch (err) {
            setRsvpError(err instanceof Error ? err.message : 'Failed to RSVP');
        } finally {
            setRsvpLoading(false);
        }
    };

    const closeRsvp = () => {
        setRsvpModalOpen(false);
        setRsvpEvent(null);
    };

    useEffect(() => {
        fetch(`${API_BASE}/events`)
            .then(r => r.json())
            .then(j => setAllEvents(j.data || []))
            .catch(() => setAllEvents(data?.upcomingEvents || []));
    }, [data]);

    const filtered = allEvents.filter(e => {
        const now = new Date();
        const eventDate = new Date(e.date);
        let matchStatus = true;
        if (status === 'UPCOMING') matchStatus = eventDate >= now;
        else if (status === 'PAST') matchStatus = eventDate < now;
        const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    useEffect(() => {
        if (rsvpModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [rsvpModalOpen]);

    if (loading || !data) {
        return <SplashScreen />;
    }

    const upcomingEvents = allEvents;

    return (
        <Layout>
            <SEO title="Events" description="Discover upcoming UPOSA events, reunions, and alumni gatherings. RSVP and stay connected with University Practice SHS alumni." canonicalPath="/events" />
            <HeroBanner icon={Calendar} title="Events" description="Stay updated with upcoming UPOSA events and revisit highlights from past gatherings." />

            {/* Upcoming Events */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Calendar} title="Events" description="Don't miss out on our next gathering." align="left" />

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {['ALL', 'UPCOMING', 'PAST'].map(s => (
                            <button key={s} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStatus(s); setPage(1); }}>
                                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                        ))}
                        <input type="text" placeholder="Search..." className="input input-bordered input-sm ml-auto w-48" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>

                    <div className="space-y-6">
                        {paginated.map((event, i) => {
                            const dateObj = new Date(event.date);
                            const eventDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                            const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                            const day = dateObj.getDate();
                            return (
                                <ScrollReveal key={event.id} delay={i * 0.1}>
                                    <Card shape="ticket">
                                        {event.imageUrl ? (
                                            <CardImage src={event.imageUrl} alt={event.title} className="h-56" />
                                        ) : (
                                            <CardAccent />
                                        )}
                                        <CardBody>
                                            <div className="flex items-start gap-4">
                                                <div className="flex flex-col items-center bg-primary text-primary-content rounded-xl px-3 py-2 min-w-[60px] shadow-sm">
                                                    <span className="text-xs font-semibold uppercase tracking-wide">{month}</span>
                                                    <span className="text-2xl font-bold leading-tight">{day}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        <StatusPill status={event.status} />
                                                    </div>
                                                    <h3 className="font-bold text-xl">{event.title}</h3>
                                                    <div className="flex flex-wrap gap-4 text-sm text-base-content/60 mt-2">
                                                        <span className="flex items-center gap-1.5">
                                                            <div className="bg-secondary/10 text-secondary rounded-xl p-2.5"><Calendar size={14} /></div>
                                                            {eventDate}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <div className="bg-secondary/10 text-secondary rounded-xl p-2.5"><Clock size={14} /></div>
                                                            {event.endDate ? `${eventDate} - ${new Date(event.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : eventDate}
                                                        </span>
                                                        {event.location && (
                                                            <span className="flex items-center gap-1.5">
                                                                <div className="bg-secondary/10 text-secondary rounded-xl p-2.5"><MapPin size={14} /></div>
                                                                {event.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="border-t border-base-300 mt-4 pt-4">
                                                <p className="text-base-content/60">{event.description}</p>
                                            </div>
                                            <div className="flex justify-end mt-3">
                                                {rsvpSubmitted.has(event.title as string) ? (
                                                    <span className="btn btn-success btn-sm no-animation gap-1"><CheckCircle2 size={14} /> RSVP'd</span>
                                                ) : (
                                                    <button className="btn btn-primary btn-sm" onClick={() => openRsvp(event.id, event.title)}>RSVP Now</button>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </ScrollReveal>
                            );
                        })}
                        {paginated.length === 0 && (
                            <EmptyState
                                icon={<Calendar size={40} />}
                                title="No Events Found"
                                description="We're planning something exciting! Check back soon for new events, reunions, and alumni gatherings."
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

            {/* RSVP Modal */}
            <AnimatePresence>
                {rsvpModalOpen && rsvpEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={closeRsvp}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Card hover={false}>
                            <CardAccent />
                            <CardBody>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-lg">
                                        {rsvpSubmitted.has(rsvpEvent.title) ? "You're Registered!" : "RSVP"}
                                    </h3>
                                    <button className="btn btn-ghost btn-sm btn-circle" onClick={closeRsvp}>
                                        <X size={18} />
                                    </button>
                                </div>

                                {rsvpSubmitted.has(rsvpEvent.title) ? (
                                    <div className="text-center space-y-4 py-4">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                        >
                                            <CheckCircle2 size={56} className="text-success mx-auto" />
                                        </motion.div>
                                        <h4 className="text-lg font-bold">RSVP Confirmed!</h4>
                                        <p className="text-sm text-base-content/60">
                                            You've registered for <strong>{rsvpEvent?.title}</strong>. We'll send a reminder to your email before the event.
                                        </p>
                                        <button className="btn btn-primary btn-sm" onClick={closeRsvp}>Close</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-base-200 rounded-lg p-3 mb-4">
                                            <p className="font-semibold text-sm">{rsvpEvent?.title}</p>
                                            {(() => {
                                                const evt = upcomingEvents.find(e => e.title === rsvpEvent?.title);
                                                if (!evt) return null;
                                                const evtDate = new Date(evt.date);
                                                const evtMonth = evtDate.toLocaleDateString('en-US', { month: 'short' });
                                                const evtDay = evtDate.getDate();
                                                return (
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className="flex flex-col items-center bg-primary text-primary-content rounded-xl px-3 py-2 min-w-[60px] shadow-sm">
                                                            <span className="text-xs font-semibold uppercase tracking-wide">{evtMonth}</span>
                                                            <span className="text-2xl font-bold leading-tight">{evtDay}</span>
                                                        </div>
                                                        <div className="text-xs text-base-content/60 space-y-1">
                                                            <span className="flex items-center gap-1.5">
                                                                <div className="bg-secondary/10 text-secondary rounded-xl p-2.5"><Calendar size={12} /></div>
                                                                {evtDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                            </span>
                                                            {evt.location && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <div className="bg-secondary/10 text-secondary rounded-xl p-2.5"><MapPin size={12} /></div>
                                                                    {evt.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="border-t border-base-300 pt-4">
                                            <form className="space-y-3" onSubmit={submitRsvp}>
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    <div className="form-control">
                                                        <label className="label"><span className="label-text text-sm font-medium">Full Name *</span></label>
                                                        <input name="name" type="text" placeholder="Your name" className="input input-bordered input-sm w-full" required />
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label"><span className="label-text text-sm font-medium">Email *</span></label>
                                                        <input name="email" type="email" placeholder="your@email.com" className="input input-bordered input-sm w-full" required />
                                                    </div>
                                                </div>
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    <div className="form-control">
                                                        <label className="label"><span className="label-text text-sm font-medium">Phone</span></label>
                                                        <input name="phone" type="tel" placeholder="+233 XX XXX XXXX" className="input input-bordered input-sm w-full" />
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label"><span className="label-text text-sm font-medium">Number of Guests</span></label>
                                                        <select className="select select-bordered select-sm w-full">
                                                            <option>Just me</option>
                                                            <option>Me + 1 guest</option>
                                                            <option>Me + 2 guests</option>
                                                            <option>Me + 3 guests</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                {rsvpError && <p className="text-error text-xs">{rsvpError}</p>}
                                                <button type="submit" className={`btn btn-primary w-full btn-sm ${rsvpLoading ? 'loading' : ''}`} disabled={rsvpLoading}>
                                                    {rsvpLoading ? 'Submitting...' : 'Confirm RSVP'}
                                                </button>
                                            </form>
                                        </div>
                                    </>
                                )}
                            </CardBody>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default Events;
