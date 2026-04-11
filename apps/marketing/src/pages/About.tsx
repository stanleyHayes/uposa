import { Layout } from "../components/layout/Layout.tsx";
import { Target, Eye, Users, BookOpen, Heart, Handshake, Download, Info, Crown, GraduationCap, Star } from "lucide-react";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { motion } from "framer-motion";
import HeroBanner from "../components/common/HeroBanner.tsx";
import SectionHeader from "../components/common/SectionHeader.tsx";
import ExecutiveHierarchy from "../components/common/ExecutiveHierarchy.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import { Card, CardAccent, CardBody } from "../components/ui/Card.tsx";

const About = () => {
    const { data, loading } = useSiteData();

    if (loading || !data) {
        return <SplashScreen />;
    }

    const mission = data.config.mission;
    const history = data.config.history;
    const executives = data.executives;
    const yearGroupReps = data.yearGroupReps;

    return (
        <Layout>
            {/* Hero */}
            <HeroBanner icon={Info} title="About UPOSA" description="Learn about our mission, history, and the people driving the University Practice Old Students Association forward." />

            {/* Mission & Vision */}
            <section id="mission" className="py-16 relative">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Target} title="Mission & Vision" description="The guiding principles that drive everything we do." />
                    <StaggerChildren className="grid md:grid-cols-2 gap-8">
                        <Card shape="wave">
                            <CardAccent />
                            <CardBody>
                                <div className="bg-secondary/10 text-secondary rounded-xl p-2.5 w-fit">
                                    <Target size={32} />
                                </div>
                                <h3 className="font-bold text-lg mt-2">Our Mission</h3>
                                <div className="border-t border-base-300/40 mt-1 pt-3">
                                    <p className="text-base-content/70">
                                        {mission.mission}
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card shape="wave">
                            <CardAccent color="secondary" />
                            <CardBody>
                                <div className="bg-secondary/10 text-secondary rounded-xl p-2.5 w-fit">
                                    <Eye size={32} />
                                </div>
                                <h3 className="font-bold text-lg mt-2">Our Vision</h3>
                                <div className="border-t border-base-300/40 mt-1 pt-3">
                                    <p className="text-base-content/70">
                                        {mission.vision}
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    </StaggerChildren>
                </div>
            </section>

            {/* Our History */}
            <section className="py-16 bg-base-200 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={GraduationCap} title="Our History" description="A look back at the journey that brought us here." />
                    <div className="max-w-3xl mx-auto relative">
                        {/* Timeline line */}
                        <motion.div
                            className="absolute left-5 md:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-primary/20"
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            style={{ transformOrigin: 'top' }}
                        />

                        <div className="space-y-8">
                            {history.paragraphs.map((paragraph: string, i: number) => (
                                <ScrollReveal key={i} delay={i * 0.1}>
                                    <div className="flex gap-4 md:gap-6 relative">
                                        {/* Timeline node */}
                                        <div className="shrink-0 relative z-10">
                                            <motion.div
                                                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-sm border border-base-300 ${
                                                    i === 0 ? 'bg-primary text-primary-content' : 'bg-base-100 text-primary'
                                                }`}
                                                whileInView={{ scale: [0.5, 1.1, 1] }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                            >
                                                {i === 0 ? (
                                                    <GraduationCap size={18} />
                                                ) : (
                                                    <span className="text-xs font-bold">{String(i).padStart(2, '0')}</span>
                                                )}
                                            </motion.div>
                                        </div>

                                        {/* Content card */}
                                        <div className={`flex-1 rounded-xl p-5 border transition-all hover:shadow-md ${
                                            i === 0
                                                ? 'bg-gradient-to-br from-primary to-accent text-primary-content border-primary/20'
                                                : 'bg-base-100 border-base-300'
                                        }`}>
                                            {i === 0 && (
                                                <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">The Beginning</p>
                                            )}
                                            <p className={`leading-relaxed text-sm md:text-base ${
                                                i === 0 ? 'text-primary-content/90' : 'text-base-content/70'
                                            }`}>
                                                {paragraph}
                                            </p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}

                            {/* End node */}
                            <div className="flex gap-4 md:gap-6 relative">
                                <div className="shrink-0 relative z-10">
                                    <motion.div
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary text-secondary-content flex items-center justify-center shadow-sm"
                                        whileInView={{ scale: [0.5, 1.1, 1] }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: history.paragraphs.length * 0.1 }}
                                    >
                                        <Star size={18} />
                                    </motion.div>
                                </div>
                                <div className="flex-1 flex items-center">
                                    <p className="text-sm font-semibold text-secondary italic">The journey continues...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* What We Do */}
            <section className="py-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #001B50 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="max-w-7xl mx-auto px-4 relative">
                    <SectionHeader icon={Heart} title="What We Do" description="Our key areas of impact and community engagement." />
                    <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: BookOpen, title: "Education Support", desc: "Funding scholarships, providing learning materials, and supporting academic programs.", color: "primary" as const },
                            { icon: Handshake, title: "Mentorship", desc: "Pairing students with alumni mentors for career guidance and personal development.", color: "secondary" as const },
                            { icon: Heart, title: "Donations & Fundraising", desc: "Raising funds for school infrastructure, equipment, and student welfare.", color: "primary" as const },
                            { icon: Users, title: "Networking", desc: "Creating platforms for alumni to connect, collaborate, and grow professionally.", color: "secondary" as const },
                        ].map((item) => (
                            <Card key={item.title}>
                                <CardAccent color={item.color} />
                                <div className="px-6 py-6 flex flex-col items-center text-center">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.color === "primary" ? "bg-secondary/10 text-secondary" : "bg-secondary/10 text-secondary"}`}>
                                        <item.icon size={26} />
                                    </div>
                                    <h3 className="font-bold text-base mt-4">{item.title}</h3>
                                    <p className="text-sm text-base-content/60 mt-2 leading-relaxed">{item.desc}</p>
                                </div>
                            </Card>
                        ))}
                    </StaggerChildren>
                </div>
            </section>

            {/* Executives — Hierarchical Display */}
            <section id="executives" className="py-16 bg-base-200">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Crown} title="Executive Team" description="Meet the dedicated leaders steering the UPOSA vision forward." />
                    <ExecutiveHierarchy executives={executives} />
                </div>
            </section>

            {/* Year Group Representatives */}
            <section id="council" className="py-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #001B50 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="max-w-7xl mx-auto px-4 relative">
                    <SectionHeader icon={Users} title="Year Group Representatives" description="Council members representing each graduating class." />
                    <Card hover={false}>
                        <CardAccent color="secondary" />
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr className="bg-primary text-primary-content">
                                        <th className="font-bold text-sm w-24">Year</th>
                                        <th className="font-bold text-sm">Representative(s)</th>
                                        <th className="font-bold text-sm hidden md:table-cell">Contact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(yearGroupReps).sort(([a], [b]) => a.localeCompare(b)).map(([year, reps]) => (
                                        <tr key={year} className="hover">
                                            <td className="font-semibold text-primary">{year}</td>
                                            <td>
                                                {reps.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {reps.map((r, i) => (
                                                            <div key={i} className="text-sm">
                                                                <span className="font-medium">{r.name}</span>
                                                                {r.contact && (
                                                                    <a href={`tel:${r.contact.split('/')[0].replace(/\s/g, '')}`} className="md:hidden text-xs block text-primary/60 hover:text-primary transition-colors">
                                                                        {r.contact}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm italic text-base-content/50">No rep listed</span>
                                                )}
                                            </td>
                                            <td className="hidden md:table-cell">
                                                {reps.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {reps.map((r, i) => (
                                                            <div key={i}>
                                                                {r.contact ? (
                                                                    <a href={`tel:${r.contact.split('/')[0].replace(/\s/g, '')}`} className="text-sm text-primary/60 hover:text-primary transition-colors">
                                                                        {r.contact}
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-sm text-base-content/40">—</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Constitution */}
            <section id="constitution" className="py-16 bg-base-200">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={BookOpen} title="Constitution & Bylaws" description="The governance framework that guides our association." align="left" />
                    <ScrollReveal>
                        <Card shape="notch" className="max-w-2xl">
                            <CardAccent />
                            <CardBody>
                                <div className="bg-secondary/10 text-secondary rounded-xl p-2.5 w-fit">
                                    <BookOpen size={28} />
                                </div>
                                <p className="text-base-content/70 mt-2">
                                    The UPOSA Constitution outlines the governance structure, membership guidelines, and operational procedures of the association. All members are encouraged to familiarize themselves with these documents.
                                </p>
                                <div className="border-t border-base-300/40 mt-3 pt-4">
                                    <a href="/UPOSA_Constitution.pdf" download className="btn btn-primary">
                                        <Download size={18} /> Download Constitution (PDF)
                                    </a>
                                </div>
                            </CardBody>
                        </Card>
                    </ScrollReveal>
                </div>
            </section>
        </Layout>
    );
};

export default About;
