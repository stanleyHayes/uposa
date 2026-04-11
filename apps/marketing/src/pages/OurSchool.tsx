import { Layout } from "../components/layout/Layout.tsx";
import { GraduationCap, Award, Trophy, Users, ChevronLeft, ChevronRight, X, School, Image, Calendar, BookOpen } from "lucide-react";
import { useState, useMemo } from "react";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import HeroBanner from "../components/common/HeroBanner.tsx";
import SectionHeader from "../components/common/SectionHeader.tsx";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import { Card, CardAccent, CardBody } from "../components/ui/Card.tsx";
import SchoolLeadershipHierarchy from "../components/common/SchoolLeadershipHierarchy.tsx";

const OurSchool = () => {
    const { data, loading } = useSiteData();
    const [galleryFilter, setGalleryFilter] = useState("All");
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const galleryCategories = useMemo(() => {
        if (!data?.gallery) return ["All"];
        const cats = new Set(data.gallery.map(g => g.category).filter(Boolean));
        return ["All", ...Array.from(cats)];
    }, [data?.gallery]);

    const filteredGallery = useMemo(() => {
        const items = data?.gallery || [];
        if (galleryFilter === "All") return items;
        return items.filter(img => img.category === galleryFilter);
    }, [data?.gallery, galleryFilter]);

    const openLightbox = (idx: number) => setLightboxIndex(idx);
    const closeLightbox = () => setLightboxIndex(null);
    const nextImage = () => {
        if (lightboxIndex !== null) setLightboxIndex((lightboxIndex + 1) % filteredGallery.length);
    };
    const prevImage = () => {
        if (lightboxIndex !== null) setLightboxIndex((lightboxIndex - 1 + filteredGallery.length) % filteredGallery.length);
    };

    if (loading || !data) {
        return <SplashScreen />;
    }

    const schoolInfo = data.config.schoolInfo;

    return (
        <Layout>
            <SEO title="Our School" description="Learn about University Practice Senior High School (UPSHS) - academic programs, achievements, notable alumni, and our rich legacy in Cape Coast, Ghana." canonicalPath="/our-school" />
            {/* Hero */}
            <HeroBanner icon={School} title="Our School" description={`${schoolInfo.name} — a proud institution of academic excellence, discipline, and holistic development since ${schoolInfo.founded}.`} />

            {/* School Overview */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <ScrollReveal direction="left">
                            <div>
                                <h2 className="text-3xl font-bold mb-6">School Overview</h2>
                                <div className="space-y-4 text-base-content/70">
                                    <p>
                                        {schoolInfo.name}, commonly known as "{schoolInfo.abbreviation}," is a co-educational institution located {schoolInfo.location}. Founded in <strong className="text-base-content">{schoolInfo.founded}</strong>, the school has grown from a small practice school into one of the most respected senior high schools in the Greater Accra Region.
                                    </p>
                                    <p>
                                        The school benefits from its unique location within a university environment, providing students with access to academic resources, mentorship from university faculty, and a culture that prioritizes learning and personal development.
                                    </p>
                                    <p>
                                        With a student population of over <strong className="text-base-content">{schoolInfo.studentPopulation.toLocaleString()}</strong> and a dedicated teaching staff of <strong className="text-base-content">{schoolInfo.teachingStaff}+</strong>, {schoolInfo.name} continues to produce outstanding graduates who excel in various fields across Ghana and beyond.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal direction="right" delay={0.15}>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Founded", value: String(schoolInfo.founded), icon: Calendar, gradient: "from-primary to-accent" },
                                    { label: "Students", value: `${schoolInfo.studentPopulation.toLocaleString()}+`, icon: Users, gradient: "from-accent to-primary" },
                                    { label: "Teaching Staff", value: `${schoolInfo.teachingStaff}+`, icon: BookOpen, gradient: "from-secondary/80 to-secondary" },
                                    { label: "Programs", value: String(schoolInfo.programs.length), icon: GraduationCap, gradient: "from-primary via-accent to-primary/60" },
                                ].map((stat) => (
                                    <div key={stat.label} className="group relative bg-base-100 border border-base-300/50 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,27,80,0.05)] hover:shadow-[0_12px_42px_rgba(0,27,80,0.09)] hover:-translate-y-1 transition-all duration-300">
                                        <div className={`h-1.5 bg-gradient-to-r ${stat.gradient}`} />
                                        <div className="p-6 flex flex-col items-center">
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                                <stat.icon size={20} className="text-white" />
                                            </div>
                                            <p className="text-4xl font-extrabold text-primary tracking-tight leading-none">{stat.value}</p>
                                            <div className="w-8 h-0.5 bg-secondary/60 rounded-full my-3" />
                                            <p className="text-sm font-medium text-base-content/60 uppercase tracking-wider">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* Programs Offered */}
            <section className="py-16 bg-base-200">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={GraduationCap} title="Programs Offered" description="Academic tracks available to students at our school." align="left" />
                    <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {schoolInfo.programs.map((prog) => (
                            <Card key={prog.name} shape="ribbon" className="h-full">
                                <CardAccent />
                                <CardBody className="items-center text-center flex flex-col">
                                    <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                        <GraduationCap size={32} />
                                    </div>
                                    <h3 className="font-bold text-base">{prog.name}</h3>
                                    <p className="text-sm text-base-content/70">{prog.description}</p>
                                </CardBody>
                            </Card>
                        ))}
                    </StaggerChildren>
                </div>
            </section>

            {/* Legacy & Achievements */}
            <section id="achievements" className="py-16">
                <div className="max-w-4xl mx-auto px-4">
                    <SectionHeader icon={Trophy} title="Legacy & Achievements" description="Milestones that define our school's proud history." align="left" />
                    <div className="space-y-4">
                        {schoolInfo.achievements.map((item, i) => (
                            <ScrollReveal key={item.year + item.description} delay={i * 0.06}>
                                <div className="flex items-stretch gap-4 group">
                                    {/* Year badge */}
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-content flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                            {item.year}
                                        </div>
                                        {i < schoolInfo.achievements.length - 1 && (
                                            <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-2" />
                                        )}
                                    </div>
                                    {/* Card */}
                                    <div className="flex-1 pb-4">
                                        <div className="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-4">
                                            <p className="font-semibold text-base-content">{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Notable Alumni */}
            <section className="py-16 bg-base-200 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                </div>
                <div className="max-w-7xl mx-auto px-4 relative">
                    <SectionHeader icon={Award} title="Notable Alumni" description="Distinguished graduates who have made their mark in various fields." />
                    <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {schoolInfo.notableAlumni.map((alum, i) => {
                            const initials = alum.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                            const accents = [
                                'from-secondary/15 via-secondary/5 to-transparent',
                                'from-primary/12 via-primary/4 to-transparent',
                                'from-accent/12 via-accent/4 to-transparent',
                            ];
                            return (
                                <ScrollReveal key={alum.name} delay={i * 0.08}>
                                    <Card className="h-full group">
                                        <CardAccent color={i % 3 === 0 ? 'secondary' : i % 3 === 1 ? 'primary' : 'accent'} />
                                        {/* Decorative gradient */}
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${accents[i % 3]} rounded-bl-[64px] pointer-events-none`} />
                                        <CardBody className="flex flex-col items-center text-center relative">
                                            {/* Avatar */}
                                            <div className="relative mb-4">
                                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 ring-4 ring-base-100">
                                                    <span className="text-2xl font-bold text-primary-content">{initials}</span>
                                                </div>
                                                {/* Star badge */}
                                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-md shadow-secondary/30 border-2 border-base-100">
                                                    <Award size={12} className="text-secondary-content" />
                                                </div>
                                            </div>

                                            {/* Name */}
                                            <h3 className="font-bold text-lg">{alum.name}</h3>

                                            {/* Achievement */}
                                            <p className="text-sm text-base-content/70 mt-1.5 leading-relaxed max-w-[260px]">{alum.achievement}</p>

                                            {/* Year badge */}
                                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/8 to-accent/5 text-primary text-xs font-semibold border border-primary/10">
                                                <GraduationCap size={12} />
                                                {alum.yearGroup}
                                            </div>
                                        </CardBody>
                                        {/* Bottom gradient accent */}
                                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
                                    </Card>
                                </ScrollReveal>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            {/* School Leadership */}
            <section id="leadership" className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Users} title="School Leadership" description="The team guiding our school's vision and operations." />
                    <SchoolLeadershipHierarchy
                        leaders={
                            data.schoolLeaders && data.schoolLeaders.length > 0
                                ? data.schoolLeaders
                                : schoolInfo.leadership.map((l) => ({ name: l.name, position: l.position, initials: l.initials }))
                        }
                    />
                </div>
            </section>

            {/* Gallery */}
            <section id="gallery" className="py-16 bg-base-200">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Image} title="Gallery" description="School events, facilities, and archived images." align="left" />
                    {filteredGallery.length > 0 || (data?.gallery && data.gallery.length > 0) ? (
                        <>
                            <ScrollReveal>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {galleryCategories.map((filter) => (
                                        <button
                                            key={filter}
                                            className={`btn btn-sm ${galleryFilter === filter ? "btn-primary" : "btn-outline"}`}
                                            onClick={() => setGalleryFilter(filter || "All")}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </ScrollReveal>
                            <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredGallery.map((img, idx) => (
                                    <Card
                                        key={img.id}
                                        className="cursor-pointer"
                                    >
                                        <figure className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden" onClick={() => openLightbox(idx)}>
                                            <img
                                                src={img.imageUrl}
                                                alt={img.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                            />
                                        </figure>
                                        <div className="py-3 px-4" onClick={() => openLightbox(idx)}>
                                            <h3 className="font-semibold text-sm">{img.title}</h3>
                                            <p className="text-xs text-base-content/60">{img.description}</p>
                                        </div>
                                    </Card>
                                ))}
                            </StaggerChildren>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <GraduationCap className="mx-auto text-primary/20 mb-3" size={48} />
                            <p className="text-base-content/50">Gallery images coming soon.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={closeLightbox}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Card hover={false}>
                            <CardAccent />
                            <figure className="max-h-[60vh] overflow-hidden">
                                <img
                                    src={filteredGallery[lightboxIndex].imageUrl}
                                    alt={filteredGallery[lightboxIndex].title}
                                    className="w-full h-full object-contain"
                                />
                            </figure>
                            <CardBody>
                                <h3 className="font-bold text-lg">{filteredGallery[lightboxIndex].title}</h3>
                                {filteredGallery[lightboxIndex].description && (
                                    <p className="text-sm text-base-content/70">{filteredGallery[lightboxIndex].description}</p>
                                )}
                                {filteredGallery[lightboxIndex].category && (
                                    <span className="badge badge-primary badge-sm">{filteredGallery[lightboxIndex].category}</span>
                                )}
                            </CardBody>
                            <div className="absolute top-3 right-3">
                                <button className="btn btn-ghost btn-sm btn-circle bg-base-100/80" onClick={closeLightbox}>
                                    <X size={18} />
                                </button>
                            </div>
                            <button
                                className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle bg-base-100/80"
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle bg-base-100/80"
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            >
                                <ChevronRight size={18} />
                            </button>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CTA */}
            <section className="py-16 bg-gradient-to-br from-[#001B50] via-[#002870] to-[#1E3A8A] text-primary-content">
                <ScrollReveal>
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-4">Proud of Our School?</h2>
                        <p className="opacity-90 mb-6">Join UPOSA and help us continue building on the legacy of {schoolInfo.name}.</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <a href="/membership" className="btn btn-secondary">Join UPOSA</a>
                            <a href="/donate" className="btn btn-outline border-current text-current hover:bg-current/10">Support the School</a>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </Layout>
    );
};

export default OurSchool;
