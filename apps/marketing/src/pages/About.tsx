import { Link } from "react-router";
import {
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    Crown,
    Download,
    Eye,
    GraduationCap,
    Handshake,
    Heart,
    Landmark,
    Mail,
    Network,
    PhoneCall,
    ScrollText,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    Users,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import ExecutiveHierarchy from "../components/common/ExecutiveHierarchy.tsx";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";

const About = () => {
    const { data, loading } = useSiteData();

    if (loading || !data) {
        return <SplashScreen />;
    }

    const mission = data.config.mission;
    const history = data.config.history;
    const executives = data.executives;
    const yearGroupReps = data.yearGroupReps;
    const stats = data.config.stats;
    const school = data.config.schoolInfo;
    const repRows = Object.entries(yearGroupReps).sort(([a], [b]) => a.localeCompare(b));
    const representedYears = repRows.filter(([, reps]) => reps.length > 0).length;
    const totalCouncilMembers = repRows.reduce((total, [, reps]) => total + reps.length, 0);

    const principles = [
        { title: "Mission", body: mission.mission, icon: Target },
        { title: "Vision", body: mission.vision, icon: Eye },
    ];

    const workStreams = [
        { title: "Education support", desc: "Funding scholarships, learning materials, academic programs, and practical school needs.", icon: BookOpen },
        { title: "Mentorship", desc: "Connecting students and young alumni with old students who can guide their next step.", icon: Handshake },
        { title: "Donations and fundraising", desc: "Turning alumni goodwill into visible projects, infrastructure, and student welfare support.", icon: Heart },
        { title: "Networking", desc: "Keeping year groups, executives, chapters, and professional connections active.", icon: Network },
    ];

    const quickFacts = [
        { label: "Alumni members", value: `${stats.members}+`, icon: Users },
        { label: "Years of legacy", value: `${stats.years}+`, icon: GraduationCap },
        { label: "Projects completed", value: `${stats.projects}+`, icon: Trophy },
        { label: "School founded", value: String(school.founded || "1976"), icon: Landmark },
    ];

    return (
        <Layout>
            <SEO canonicalPath="/about" title="About UPOSA" />

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
                    className="pointer-events-none absolute -right-24 top-8 h-[520px] w-[520px] object-contain opacity-[0.08] md:top-4 md:h-[680px] md:w-[680px]"
                />

                <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1fr_430px] lg:items-center">
                    <HeroReveal>
                        <div className="max-w-4xl">
                            <div className="mb-8 inline-flex items-center gap-3 border border-primary/15 bg-base-200 px-4 py-2">
                                <img src="/logo.png" alt="UPOSA crest" className="h-10 w-10 bg-base-100 object-contain p-1" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">About UPOSA</p>
                                    <p className="text-sm font-semibold text-primary/70">University Practice Old Students Association</p>
                                </div>
                            </div>

                            <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                                <ShieldCheck size={16} />
                                Association identity
                            </p>
                            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] md:text-7xl">
                                The old students network built around service, memory, and school progress.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                UPOSA exists to keep University Practice old students organized, useful, and connected to the school that shaped them.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <a href="#mission" className="btn btn-primary btn-lg">
                                    Mission and vision <ArrowRight size={18} />
                                </a>
                                <a href="#executives" className="btn btn-secondary btn-lg">
                                    Meet leadership
                                </a>
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Association brief</p>
                                        <h2 className="mt-2 text-3xl font-bold leading-tight">What UPOSA carries forward</h2>
                                    </div>
                                    <img src="/logo.png" alt="" aria-hidden="true" className="h-16 w-16 shrink-0 bg-primary-content object-contain p-1.5" />
                                </div>
                                <div className="mt-7 space-y-3">
                                    {quickFacts.map((fact) => {
                                        const Icon = fact.icon;
                                        return (
                                            <div key={fact.label} className="flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-secondary text-secondary-content">
                                                    <Icon size={21} />
                                                </span>
                                                <span>
                                                    <span className="block text-2xl font-bold leading-none">{fact.value}</span>
                                                    <span className="mt-1 block text-xs font-bold uppercase tracking-[0.16em] text-primary-content/45">{fact.label}</span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section id="mission" className="bg-primary py-16 text-primary-content md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-10 max-w-3xl">
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Mission and vision</p>
                            <h2 className="text-4xl font-bold leading-tight md:text-5xl">The operating principles behind the association.</h2>
                        </div>
                    </ScrollReveal>

                    <StaggerChildren className="grid gap-5 md:grid-cols-2">
                        {principles.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="border border-primary-content/10 bg-primary-content/10 p-6 md:p-8">
                                    <div className="mb-8 flex items-start justify-between gap-4">
                                        <span className="flex h-14 w-14 items-center justify-center bg-secondary text-secondary-content">
                                            <Icon size={27} />
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary-content/35">UPOSA</span>
                                    </div>
                                    <h3 className="text-3xl font-bold">{item.title}</h3>
                                    <p className="mt-4 leading-relaxed text-primary-content/68">{item.body}</p>
                                </div>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            <section className="relative overflow-hidden bg-base-100 py-16 md:py-24">
                <div className="absolute left-0 top-0 h-full w-2 bg-secondary" />
                <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
                    <ScrollReveal direction="right">
                        <div className="sticky top-24">
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Our history</p>
                            <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">A school story carried by many year groups.</h2>
                            <p className="mt-5 leading-relaxed text-base-content/65">
                                UPOSA’s history is not just nostalgia. It is a record of old students choosing to stay connected to one another and useful to the school.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="space-y-4">
                        {history.paragraphs.map((paragraph, index) => (
                            <ScrollReveal key={index} delay={index * 0.08}>
                                <div className="grid gap-4 border border-base-300 bg-base-100 p-5 shadow-sm md:grid-cols-[84px_1fr]">
                                    <div className="flex h-16 w-16 items-center justify-center bg-primary text-primary-content">
                                        {index === 0 ? <GraduationCap size={25} /> : <span className="text-xl font-bold">{String(index).padStart(2, "0")}</span>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">{index === 0 ? "The beginning" : "Archive note"}</p>
                                        <p className="mt-2 leading-relaxed text-base-content/68">{paragraph}</p>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                        <div className="border border-secondary/30 bg-secondary/10 p-5">
                            <p className="flex items-center gap-2 font-bold text-primary">
                                <Sparkles size={18} className="text-secondary" />
                                The journey continues through today’s members, executives, and year-group council.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-base-200 py-16 md:py-24">
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 top-8 h-[360px] w-[360px] object-contain opacity-[0.035]"
                />
                <div className="relative mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[380px_1fr] lg:items-start">
                    <ScrollReveal direction="right">
                        <div className="flex flex-col border border-base-300 bg-primary p-6 text-primary-content shadow-sm md:p-8">
                            <Sparkles size={34} className="mb-8 text-secondary" />
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">What we do</p>
                            <h2 className="text-4xl font-bold leading-tight md:text-5xl">Practical service lanes.</h2>
                            <p className="mt-5 text-sm leading-relaxed text-primary-content/65">
                                UPOSA works through a few practical lanes, so members can see where their time, dues, and goodwill create visible support.
                            </p>
                            <Link to="/membership" className="btn btn-secondary mt-8 w-full">
                                Join the network <ArrowRight size={16} />
                            </Link>
                        </div>
                    </ScrollReveal>

                    <div className="overflow-hidden border border-base-300 bg-base-100 shadow-sm">
                        <StaggerChildren className="grid md:grid-cols-2">
                            {workStreams.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.title}
                                        className="group flex min-h-[230px] flex-col border-b border-base-300 p-6 transition hover:bg-base-200 md:border-r md:[&:nth-child(2n)]:border-r-0 md:[&:nth-last-child(-n+2)]:border-b-0"
                                    >
                                        <div className="mb-8 flex items-start justify-between gap-4">
                                            <span className="flex h-14 w-14 items-center justify-center bg-secondary/10 text-secondary transition group-hover:bg-secondary group-hover:text-secondary-content">
                                                <Icon size={26} />
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-base-content/35">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                        </div>
                                        <h3 className="max-w-sm text-2xl font-bold leading-tight text-primary">{item.title}</h3>
                                        <p className="mt-4 max-w-md text-sm leading-relaxed text-base-content/60">{item.desc}</p>
                                        <div className="mt-auto flex items-center justify-between border-t border-base-300 pt-5 text-sm font-bold text-primary">
                                            <span>Service lane</span>
                                            <ArrowUpRight size={17} className="text-base-content/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-secondary" />
                                        </div>
                                    </div>
                                );
                            })}
                        </StaggerChildren>
                    </div>
                </div>
            </section>

            <section id="executives" className="bg-base-100 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Executive team</p>
                                <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">The leadership structure steering UPOSA forward.</h2>
                            </div>
                            <Crown size={40} className="text-secondary" />
                        </div>
                    </ScrollReveal>
                    <ExecutiveHierarchy executives={executives} />
                </div>
            </section>

            <section id="council" className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                            <div className="max-w-3xl">
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Year-group council</p>
                                <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">Representation across the old students community.</h2>
                                <p className="mt-4 leading-relaxed text-base-content/65">Council members keep year groups visible, reachable, and part of the association’s decision-making rhythm.</p>
                            </div>
                            <div className="border border-primary/10 bg-primary p-5 text-primary-content shadow-lg">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Council registry</p>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <div className="border border-primary-content/10 bg-primary-content/10 p-4">
                                        <p className="text-3xl font-bold">{representedYears}</p>
                                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-content/45">Year groups</p>
                                    </div>
                                    <div className="border border-primary-content/10 bg-primary-content/10 p-4">
                                        <p className="text-3xl font-bold">{totalCouncilMembers}</p>
                                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-content/45">Council reps</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    <StaggerChildren className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {repRows.map(([year, reps]) => (
                            <div key={year} className="group h-full border border-base-300 bg-base-100 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg">
                                <div className="mb-6 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-base-content/40">Year group</p>
                                        <h3 className="mt-1 text-3xl font-bold text-primary">{year}</h3>
                                    </div>
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-secondary/10 text-secondary">
                                        <Users size={23} />
                                    </div>
                                </div>

                                {reps.length > 0 ? (
                                    <div className="space-y-3">
                                        {reps.map((rep, index) => (
                                            <div key={`${year}-${index}`} className="border-t border-base-300/70 pt-3">
                                                <p className="font-bold text-primary">{rep.name}</p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {rep.contact ? (
                                                        <a
                                                            href={`tel:${rep.contact.split("/")[0].replace(/\s/g, "")}`}
                                                            className="inline-flex items-center gap-1.5 bg-base-200 px-2.5 py-1 text-xs font-semibold text-primary/70 transition-colors hover:text-primary"
                                                        >
                                                            <PhoneCall size={12} />
                                                            {rep.contact}
                                                        </a>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 bg-base-200 px-2.5 py-1 text-xs font-semibold text-base-content/40">
                                                            <PhoneCall size={12} />
                                                            Contact pending
                                                        </span>
                                                    )}
                                                    {rep.email && (
                                                        <a
                                                            href={`mailto:${rep.email}`}
                                                            className="inline-flex items-center gap-1.5 bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary transition-colors hover:text-primary"
                                                        >
                                                            <Mail size={12} />
                                                            Email
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border-t border-base-300/70 pt-4">
                                        <p className="text-sm italic leading-relaxed text-base-content/45">Representative details are not listed yet for this year group.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </StaggerChildren>
                </div>
            </section>

            <section id="constitution" className="relative overflow-hidden bg-primary py-16 text-primary-content md:py-24">
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: "linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)",
                        backgroundSize: "42px 42px",
                    }}
                />
                <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-36 -right-16 h-[420px] w-[420px] object-contain opacity-[0.1]" />
                <div className="relative mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <ScrollReveal direction="right">
                        <div>
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Constitution and bylaws</p>
                            <h2 className="text-4xl font-bold leading-tight md:text-5xl">The governance framework behind the association.</h2>
                        </div>
                    </ScrollReveal>
                    <ScrollReveal direction="left">
                        <div className="border border-primary-content/10 bg-primary-content/10 p-6 md:p-8">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center bg-secondary text-secondary-content">
                                <ScrollText size={27} />
                            </div>
                            <p className="leading-relaxed text-primary-content/70">
                                The UPOSA Constitution outlines the governance structure, membership guidelines, and operational procedures of the association. All members are encouraged to familiarize themselves with these documents.
                            </p>
                            <a href="/UPOSA_Constitution.pdf" download className="btn btn-secondary mt-7">
                                <Download size={18} /> Download Constitution
                            </a>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </Layout>
    );
};

export default About;
