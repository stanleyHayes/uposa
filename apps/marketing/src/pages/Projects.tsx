import { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout.tsx";
import { Link } from "react-router";
import { CheckCircle, Clock, HandHeart, Megaphone, Heart, FolderKanban, Trophy, FolderOpen } from "lucide-react";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import HeroBanner from "../components/common/HeroBanner.tsx";
import SectionHeader from "../components/common/SectionHeader.tsx";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import EmptyState from "../components/common/EmptyState.tsx";
import StatusPill from "../components/common/StatusPill.tsx";
import { Card, CardAccent, CardBody, CardImage } from "../components/ui/Card.tsx";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Projects = () => {
    const { data, loading } = useSiteData();
    const [allProjects, setAllProjects] = useState<any[]>([]);
    const [status, setStatus] = useState('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PER_PAGE = 6;

    useEffect(() => {
        fetch(`${API_BASE}/projects`)
            .then(r => r.json())
            .then(j => setAllProjects(j.data || []))
            .catch(() => setAllProjects(data?.ongoingProjects || []));
    }, [data]);

    const filtered = allProjects.filter(p => {
        const matchStatus = status === 'ALL' || p.status === status;
        const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    if (loading || !data) {
        return <SplashScreen />;
    }

    return (
        <Layout>
            <SEO title="Projects" description="Explore UPOSA's ongoing and completed projects supporting University Practice Senior High School infrastructure, NSMQ team, and student welfare." canonicalPath="/projects" />
            <HeroBanner icon={FolderKanban} title="Projects & Initiatives" description="Discover our ongoing and completed projects that are transforming University Practice SHS." />

            {/* Ongoing Projects */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Clock} title="Projects" description="Active initiatives making a difference right now." align="left" />

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {['ALL', 'ONGOING', 'COMPLETED', 'PAUSED'].map(s => (
                            <button key={s} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStatus(s); setPage(1); }}>
                                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                        ))}
                        <input type="text" placeholder="Search..." className="input input-bordered input-sm ml-auto w-48" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>

                    {paginated.length === 0 ? (
                        <EmptyState icon={<FolderOpen size={40} />} title="No Projects Found" description="We're planning impactful initiatives to support University Practice SHS. Stay tuned for new projects!" />
                    ) : (
                        <StaggerChildren className="grid md:grid-cols-3 gap-6">
                            {paginated.map((project) => {
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
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                                    <Clock size={18} />
                                                </div>
                                                <StatusPill status={project.status} />
                                            </div>
                                            <h3 className="font-bold text-lg">{project.title}</h3>
                                            <p className="text-sm text-base-content/70">{project.description}</p>
                                            <div className="border-t border-base-300 mt-4 pt-4">
                                                <div className="flex justify-between text-sm mb-1.5">
                                                    <span>{progress}% funded</span>
                                                </div>
                                                <div className="w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-secondary to-secondary/80 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                                </div>
                                                <div className="flex justify-between text-xs text-base-content/50 mt-1.5">
                                                    <span>GH₵ {project.raisedAmount.toLocaleString()}</span>
                                                    <span>GH₵ {project.goalAmount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <span className="btn btn-primary btn-sm mt-3">Learn More</span>
                                        </CardBody>
                                    </Card>
                                    </Link>
                                );
                            })}
                        </StaggerChildren>
                    )}

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

            {/* NSMQ */}
            <section id="nsmq" className="py-16 bg-base-200">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Trophy} title="NSMQ - National Science & Maths Quiz" description="Supporting our school's proud tradition in the national competition." align="left" />
                    <div className="grid md:grid-cols-2 gap-8">
                        <ScrollReveal direction="left" delay={0.1}>
                            <div>
                                <p className="text-base-content/70 mb-4">
                                    University Practice SHS has a proud tradition of participation in the National Science and Maths Quiz (NSMQ). UPOSA actively supports our school's NSMQ team through funding, coaching support, and motivational programs.
                                </p>
                                <p className="text-base-content/70 mb-4">
                                    Our alumni include several former NSMQ contestants who now serve as mentors and coaches for current teams.
                                </p>
                                <Link to="/donate" className="btn btn-primary btn-sm">Support NSMQ Team</Link>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal direction="right" delay={0.2}>
                            <Card shape="notch">
                                <CardAccent color="secondary" />
                                <CardBody>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                            <Trophy size={18} />
                                        </div>
                                        <h3 className="font-bold text-lg">NSMQ Highlights</h3>
                                    </div>
                                    <ul className="space-y-2 text-sm text-base-content/70">
                                        <li className="flex items-start gap-2"><CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> Consistent regional qualifiers</li>
                                        <li className="flex items-start gap-2"><CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> Alumni-funded coaching program</li>
                                        <li className="flex items-start gap-2"><CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> Annual science quiz prep workshops</li>
                                        <li className="flex items-start gap-2"><CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> Partnership with STEM professionals</li>
                                    </ul>
                                </CardBody>
                            </Card>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* How to Support */}
            <section className="py-16 bg-gradient-to-br from-[#001B50] via-[#002870] to-[#1E3A8A] text-primary-content">
                <ScrollReveal>
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-6">How to Support</h2>
                        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                            <div className="flex flex-col items-center gap-3">
                                <HandHeart size={32} />
                                <h3 className="font-semibold">Volunteer</h3>
                                <p className="text-sm opacity-80">Give your time and skills to help with projects and events.</p>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <Heart size={32} />
                                <h3 className="font-semibold">Donate</h3>
                                <p className="text-sm opacity-80">Financial contributions directly fund school improvements.</p>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <Megaphone size={32} />
                                <h3 className="font-semibold">Spread Awareness</h3>
                                <p className="text-sm opacity-80">Share our mission with fellow alumni and the wider community.</p>
                            </div>
                        </div>
                        <Link to="/donate" className="btn btn-secondary mt-8">Make a Donation</Link>
                    </div>
                </ScrollReveal>
            </section>
        </Layout>
    );
};

export default Projects;
