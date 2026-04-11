import { Layout } from "../components/layout/Layout.tsx";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Calendar, ArrowRight, Users, BookOpen, Heart, Star, MapPin, Clock, Sparkles, GraduationCap, FolderOpen, Trophy, Newspaper, User, ChevronRight } from "lucide-react";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import { AnimatedCounter } from "../components/common/AnimatedCounter.tsx";
import SEO from "../components/common/SEO.tsx";
import EmptyState from "../components/common/EmptyState.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import { subscribeNewsletter } from "../api/client.ts";
import SplashScreen from "../components/common/SplashScreen.tsx";
import { Card, CardAccent, CardBody, CardImage } from "../components/ui/Card.tsx";


const Home = () => {
    const { data, loading } = useSiteData();
    const [nlDone, setNlDone] = useState(false);
    const [nlLoading, setNlLoading] = useState(false);

    if (loading || !data) {
        return <SplashScreen />;
    }

    const stats = data.config.stats;
    const upcomingEvents = data.upcomingEvents;
    const ongoingProjects = data.ongoingProjects;
    const latestNews = data.latestNews;

    return (
        <Layout>
            <SEO canonicalPath="/" />
            {/* Hero Banner */}
            <section className="relative bg-primary text-primary-content overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#001B50] via-[#002870] to-[#1E3A8A]" />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

                {/* Glow orbs */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

                {/* Doodles */}
                <motion.div className="absolute top-[12%] left-[6%] w-20 h-20 rounded-full border-2 border-white/[0.06]" animate={{ y: [0, -14, 0], rotate: [0, 10, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute top-[18%] right-[8%] w-12 h-12 border-2 border-secondary/10 rotate-45" animate={{ y: [0, -10, 0], rotate: [45, 55, 35, 45] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
                <motion.div className="absolute bottom-[15%] left-[12%] w-8 h-8 bg-secondary/8 rounded-lg" animate={{ y: [0, -12, 0], scale: [1, 1.15, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
                <motion.div className="absolute bottom-[20%] right-[15%] w-16 h-16 rounded-full border-2 border-dashed border-white/[0.05]" animate={{ y: [0, -8, 0], rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
                <motion.div className="absolute top-[45%] left-[3%] w-5 h-5 bg-white/[0.04] rounded-full" animate={{ y: [0, -18, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
                <motion.div className="absolute top-[30%] right-[4%] w-14 h-3 bg-secondary/6 rounded-full" animate={{ y: [0, -10, 0], scaleX: [1, 1.3, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }} />
                <motion.div className="absolute bottom-[35%] right-[30%] w-6 h-6 border-2 border-white/[0.04] rounded-md rotate-12" animate={{ y: [0, -12, 0], rotate: [12, 24, 0, 12] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }} />
                <motion.div className="absolute top-[60%] left-[25%] w-3 h-3 bg-secondary/10 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }} />
                <motion.div className="absolute top-[8%] left-[40%] w-10 h-10 rounded-full border border-white/[0.03]" animate={{ y: [0, -6, 0], scale: [1, 1.1, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />
                <motion.div className="absolute bottom-[10%] left-[45%] w-4 h-12 bg-white/[0.02] rounded-full rotate-[30deg]" animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }} />

                <div className="relative max-w-7xl mx-auto px-4 py-28 md:py-36">
                    <HeroReveal>
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
                                <Sparkles size={14} className="text-secondary" />
                                <span className="text-sm font-medium text-white/80">University Practice Old Students Association</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                                Connecting Generations of Excellence
                            </h1>
                            <p className="text-lg md:text-xl mb-8 text-white/75 max-w-2xl">
                                Together, we build on our legacy, support our alma mater, and empower the next generation of leaders.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link to="/membership" className="btn btn-secondary btn-lg shadow-lg shadow-secondary/25">Join Us</Link>
                                <Link to="/donate" className="btn btn-lg bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">Donate</Link>
                            </div>
                        </div>
                    </HeroReveal>
                </div>
            </section>

            {/* Stats */}
            <section className="relative -mt-10 z-10 pb-10">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="relative rounded-2xl shadow-xl overflow-hidden bg-gradient-to-r from-[#001B50] via-[#002870] to-[#001B50]">
                        {/* Decorative background elements */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 left-1/4 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#D4AF37]/8 rounded-full blur-3xl" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-white/3 rounded-full blur-2xl" />
                        </div>
                        <div className="relative grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
                            {[
                                { value: stats.members, suffix: '+', label: 'Alumni Members', icon: Users },
                                { value: stats.years, suffix: '+', label: 'Years of Legacy', icon: GraduationCap },
                                { value: stats.projects, suffix: '+', label: 'Projects Completed', icon: FolderOpen },
                                { value: stats.events, suffix: '+', label: 'Events Organized', icon: Trophy },
                            ].map((stat, i) => (
                                <ScrollReveal key={stat.label} delay={i * 0.1}>
                                    <div className="flex flex-col items-center text-center p-6 md:p-8 group hover:bg-white/5 transition-colors">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#D4AF37]/20 transition-all">
                                            <stat.icon className="w-6 h-6 text-[#D4AF37]" />
                                        </div>
                                        <p className="text-3xl md:text-4xl font-bold text-white">
                                            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                        </p>
                                        <p className="text-sm text-white/50 mt-1.5 font-medium">{stat.label}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* About Preview */}
            <section className="py-16 md:py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <ScrollReveal direction="left">
                            <div>
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/10 text-secondary mb-4">
                                    <Users size={22} />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-4">About the Association</h2>
                                <p className="text-base-content/60 mb-4 leading-relaxed">
                                    The University Practice Old Students Association (UPOSA) is a vibrant community of alumni dedicated to supporting our alma mater and fostering connections among graduates across generations.
                                </p>
                                <p className="text-base-content/60 mb-8 leading-relaxed">
                                    Through education support, mentorship programs, and community initiatives, we work together to ensure that the legacy of excellence continues.
                                </p>
                                <Link to="/about" className="btn btn-primary">
                                    Learn More <ArrowRight size={16} />
                                </Link>
                            </div>
                        </ScrollReveal>
                        <StaggerChildren className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Users, title: "Networking", desc: "Connect with fellow alumni", color: "primary" },
                                { icon: BookOpen, title: "Education", desc: "Support student learning", color: "secondary" },
                                { icon: Heart, title: "Mentorship", desc: "Guide the next generation", color: "secondary" },
                                { icon: Star, title: "Legacy", desc: "Build on our heritage", color: "primary" },
                            ].map((item) => {
                                const IconComp = item.icon;
                                return (
                                    <Card key={item.title} className="p-6 text-center">
                                        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                                            <IconComp className="text-secondary" size={24} />
                                        </div>
                                        <h3 className="font-semibold">{item.title}</h3>
                                        <p className="text-sm text-base-content/50 mt-1">{item.desc}</p>
                                    </Card>
                                );
                            })}
                        </StaggerChildren>
                    </div>
                </div>
            </section>

            {/* Upcoming Events */}
            <section className="py-16 bg-base-200">
                <div className="max-w-7xl mx-auto px-4">
                    <ScrollReveal>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-bold">Upcoming Events</h2>
                            <Link to="/events" className="btn btn-ghost btn-sm text-primary">
                                View All <ArrowRight size={16} />
                            </Link>
                        </div>
                    </ScrollReveal>
                    {upcomingEvents.length === 0 ? (
                        <EmptyState icon={<Calendar size={36} />} title="No Upcoming Events" description="Stay tuned for exciting events, reunions, and alumni gatherings!" />
                    ) : (
                        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {upcomingEvents.slice(0, 3).map((event) => {
                                const eventDate = new Date(event.date);
                                return (
                                    <Card key={event.id} shape="ticket">
                                        {event.imageUrl ? (
                                            <CardImage src={event.imageUrl} alt={event.title} />
                                        ) : (
                                            <CardAccent />
                                        )}
                                        <CardBody className="p-4 sm:p-5">
                                            <div className="flex items-start gap-3 sm:gap-4">
                                                <div className="flex flex-col items-center bg-primary text-primary-content rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[50px] sm:min-w-[60px] shadow-sm shrink-0">
                                                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                    <span className="text-xl sm:text-2xl font-bold leading-tight">{eventDate.getDate()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-base sm:text-lg leading-snug mb-1.5 sm:mb-2">{event.title}</h3>
                                                    <div className="flex items-center gap-1.5 text-base-content/60 text-xs sm:text-sm mb-1">
                                                        <MapPin size={14} className="shrink-0" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-base-content/60 text-xs sm:text-sm">
                                                        <Clock size={14} className="shrink-0" />
                                                        <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end mt-3 pt-3 border-t border-base-300/40">
                                                <Link to="/events" className="btn btn-primary btn-sm group-hover/card:btn-secondary transition-colors">RSVP</Link>
                                            </div>
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </StaggerChildren>
                    )}
                </div>
            </section>

            {/* Featured Projects */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <ScrollReveal>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-bold">Featured Projects</h2>
                            <Link to="/projects" className="btn btn-ghost btn-sm text-primary">
                                View All <ArrowRight size={16} />
                            </Link>
                        </div>
                    </ScrollReveal>
                    {ongoingProjects.length === 0 ? (
                        <EmptyState icon={<BookOpen size={36} />} title="No Active Projects" description="We're working on exciting initiatives to support our alma mater. Check back soon!" />
                    ) : (
                        <StaggerChildren className="grid md:grid-cols-3 gap-6">
                            {ongoingProjects.slice(0, 3).map((project) => {
                                const progress = project.goalAmount > 0 ? Math.round((project.raisedAmount / project.goalAmount) * 100) : 0;
                                return (
                                    <Link key={project.id} to={`/projects/${project.slug}`} className="block">
                                    <Card shape="notch">
                                        {project.imageUrl ? (
                                            <CardImage src={project.imageUrl} alt={project.title} />
                                        ) : (
                                            <CardAccent color="secondary" />
                                        )}
                                        <CardBody>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                                    <BookOpen size={22} />
                                                </div>
                                                <h3 className="font-bold text-lg leading-snug flex-1">{project.title}</h3>
                                            </div>
                                            <p className="text-sm text-base-content/70 line-clamp-2 mb-4">{project.description}</p>
                                            <div className="mt-auto">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-base-content/60">Raised</span>
                                                    <span className="font-bold text-primary">{progress}%</span>
                                                </div>
                                                <div className="w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-secondary to-secondary/80 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-base-content/50 mt-1.5">
                                                    <span>GH₵ {project.raisedAmount.toLocaleString()}</span>
                                                    <span>GH₵ {project.goalAmount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                    </Link>
                                );
                            })}
                        </StaggerChildren>
                    )}
                </div>
            </section>

            {/* Latest News & Blog */}
            <section className="py-16 bg-base-200">
                <div className="max-w-7xl mx-auto px-4">
                    <ScrollReveal>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-bold">Latest News & Blog</h2>
                            <Link to="/news" className="btn btn-ghost btn-sm text-primary">
                                View All <ArrowRight size={16} />
                            </Link>
                        </div>
                    </ScrollReveal>
                    {latestNews.length === 0 ? (
                        <EmptyState icon={<Newspaper size={36} />} title="No Articles Yet" description="Stay tuned for news, stories, and updates from the UPOSA community!" />
                    ) : (
                        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {latestNews.slice(0, 3).map((article) => (
                                <Link key={article.id} to={`/news/${article.slug}`} className="block group">
                                    <Card>
                                        {/* Image */}
                                        <div className="relative overflow-hidden">
                                            {article.imageUrl ? (
                                                <img
                                                    src={article.imageUrl}
                                                    alt={article.title}
                                                    loading="lazy"
                                                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-48 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 flex items-center justify-center">
                                                    <Newspaper size={36} className="text-primary/15" />
                                                </div>
                                            )}
                                            {/* Category overlay */}
                                            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-content px-2.5 py-1 rounded-full">
                                                {article.category?.charAt(0) + article.category?.slice(1).toLowerCase()}
                                            </span>
                                        </div>

                                        <CardBody>
                                            {/* Meta row */}
                                            <div className="flex items-center gap-2 mb-2.5 text-xs text-base-content/45">
                                                {article.publishedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={11} />
                                                        {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                )}
                                                {article.authorName && (
                                                    <>
                                                        <span className="w-0.5 h-0.5 rounded-full bg-base-content/20" />
                                                        <span className="flex items-center gap-1">
                                                            <User size={11} />
                                                            {article.authorName}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            <h3 className="font-bold text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                                {article.title}
                                            </h3>
                                            <p className="text-sm text-base-content/55 line-clamp-2 leading-relaxed">
                                                {article.excerpt || article.content?.slice(0, 120)}
                                            </p>

                                            <div className="mt-4 pt-3 border-t border-base-300/40 flex items-center text-sm font-semibold text-primary gap-1 group-hover:gap-2 transition-all">
                                                Read more <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Link>
                            ))}
                        </StaggerChildren>
                    )}
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="relative py-20 bg-primary text-primary-content overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#001B50] via-[#002870] to-[#1E3A8A]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <ScrollReveal>
                    <div className="relative max-w-3xl mx-auto px-4 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
                            <Sparkles size={14} className="text-secondary" />
                            <span className="text-sm font-medium text-white/80">Newsletter</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Connected</h2>
                        <p className="mb-8 text-white/70 max-w-lg mx-auto">
                            Subscribe to our newsletter to receive updates on events, projects, and alumni news.
                        </p>
                        {nlDone ? (
                            <p className="text-secondary font-medium text-sm">You're subscribed! We'll keep you posted.</p>
                        ) : (
                            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={async (e) => {
                                e.preventDefault();
                                setNlLoading(true);
                                const fd = new FormData(e.currentTarget);
                                try {
                                    await subscribeNewsletter(fd.get('email') as string);
                                    setNlDone(true);
                                } catch { /* silent */ } finally {
                                    setNlLoading(false);
                                }
                            }}>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    className="input input-bordered w-full sm:flex-1 bg-white/10 backdrop-blur-sm border-white/15 text-white placeholder:text-white/50"
                                    required
                                />
                                <button type="submit" className={`btn btn-secondary w-full sm:w-auto shadow-lg shadow-secondary/25 ${nlLoading ? 'loading' : ''}`} disabled={nlLoading}>
                                    {nlLoading ? '...' : 'Subscribe'}
                                </button>
                            </form>
                        )}
                    </div>
                </ScrollReveal>
            </section>
        </Layout>
    );
};

export default Home;
