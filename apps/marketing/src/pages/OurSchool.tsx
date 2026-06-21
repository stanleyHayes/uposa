import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    ArrowUpRight,
    Award,
    BookOpen,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Crown,
    GraduationCap,
    Image as ImageIcon,
    Landmark,
    MapPin,
    School,
    ShieldCheck,
    Sparkles,
    Users,
    X,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import { useSiteData, type GalleryItemData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import EmptyState from "../components/common/EmptyState.tsx";
import { Card, CardAccent, CardBody } from "../components/ui/Card.tsx";
import SchoolLeadershipHierarchy from "../components/common/SchoolLeadershipHierarchy.tsx";

type GalleryTileProps = {
    image: GalleryItemData;
    index: number;
    onOpen: (index: number) => void;
};

const GalleryTile = ({ image, index, onOpen }: GalleryTileProps) => {
    const [imageFailed, setImageFailed] = useState(false);
    const isFeatured = index === 0;
    const category = image.category || "Gallery";

    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.18) }}
            className={`group relative isolate h-full min-h-[260px] overflow-hidden border border-primary/10 bg-primary text-left text-primary-content shadow-sm transition-all hover:z-10 hover:border-secondary/70 hover:shadow-xl ${isFeatured ? "md:col-span-2 md:row-span-2" : ""}`}
            onClick={() => onOpen(index)}
        >
            {!imageFailed ? (
                <img
                    src={image.imageUrl}
                    alt={image.title}
                    loading="lazy"
                    onError={() => setImageFailed(true)}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-100 p-6 text-center">
                    <div className="mb-4 border border-secondary/30 bg-base-200 p-4">
                        <img src="/logo.png" alt="" aria-hidden="true" className="h-16 w-16 object-contain opacity-90" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Image unavailable</p>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent opacity-95" />
            <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4">
                <span className="bg-secondary px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primary">
                    {category}
                </span>
                <span className="grid h-9 w-9 place-items-center border border-primary-content/20 bg-primary/55 text-primary-content transition-colors group-hover:bg-secondary group-hover:text-primary">
                    <ArrowUpRight size={17} />
                </span>
            </div>
            <div className="relative z-10 flex h-full flex-col justify-end p-5 md:p-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-content/65">
                    {String(index + 1).padStart(2, "0")} / {category}
                </p>
                <h3 className={`${isFeatured ? "text-3xl md:text-4xl" : "text-2xl"} font-bold leading-tight text-primary-content`}>
                    {image.title}
                </h3>
                {image.description && (
                    <p className={`mt-3 max-w-2xl leading-relaxed text-primary-content/75 ${isFeatured ? "line-clamp-3" : "line-clamp-2 text-sm"}`}>
                        {image.description}
                    </p>
                )}
            </div>
        </motion.button>
    );
};

const OurSchool = () => {
    const { data, loading } = useSiteData();
    const [galleryFilter, setGalleryFilter] = useState("All");
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const galleryCategories = useMemo(() => {
        if (!data?.gallery) return ["All"];
        const cats = new Set(data.gallery.map((item) => item.category).filter(Boolean));
        return ["All", ...Array.from(cats)];
    }, [data?.gallery]);

    const filteredGallery = useMemo(() => {
        const items = data?.gallery || [];
        if (galleryFilter === "All") return items;
        return items.filter((item) => item.category === galleryFilter);
    }, [data?.gallery, galleryFilter]);

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const nextImage = () => {
        if (lightboxIndex !== null && filteredGallery.length > 0) {
            setLightboxIndex((lightboxIndex + 1) % filteredGallery.length);
        }
    };
    const prevImage = () => {
        if (lightboxIndex !== null && filteredGallery.length > 0) {
            setLightboxIndex((lightboxIndex - 1 + filteredGallery.length) % filteredGallery.length);
        }
    };

    if (loading || !data) {
        return <SplashScreen />;
    }

    const schoolInfo = data.config.schoolInfo;
    const leaders = data.schoolLeaders && data.schoolLeaders.length > 0
        ? data.schoolLeaders
        : schoolInfo.leadership.map((leader) => ({
            name: leader.name,
            position: leader.position,
            initials: leader.initials,
        }));

    const schoolFacts = [
        { label: "Founded", value: String(schoolInfo.founded), icon: Calendar },
        { label: "Students", value: `${schoolInfo.studentPopulation.toLocaleString()}+`, icon: Users },
        { label: "Teaching staff", value: `${schoolInfo.teachingStaff}+`, icon: BookOpen },
        { label: "Programs", value: String(schoolInfo.programs.length), icon: GraduationCap },
    ];

    return (
        <Layout>
            <SEO title="Our School" description="Learn about University Practice Senior High School (UPSHS), its academic programs, leadership, achievements, gallery, and legacy in Cape Coast, Ghana." canonicalPath="/our-school" />

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
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Our school</p>
                                    <p className="text-sm font-semibold text-primary/70">{schoolInfo.abbreviation || "UPSHS"} legacy</p>
                                </div>
                            </div>

                            <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                                <ShieldCheck size={16} />
                                School identity
                            </p>
                            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] md:text-7xl">
                                {schoolInfo.name} is the home ground of the UPOSA story.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                A school shaped by discipline, learning, leadership, and the old students who continue to carry its name forward.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <a href="#programs" className="btn btn-primary btn-lg">
                                    Academic programs <ArrowRight size={18} />
                                </a>
                                <a href="#gallery" className="btn btn-secondary btn-lg">
                                    View gallery
                                </a>
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">School brief</p>
                                        <h2 className="mt-2 text-3xl font-bold leading-tight">{schoolInfo.abbreviation || schoolInfo.name}</h2>
                                    </div>
                                    <img src="/logo.png" alt="" aria-hidden="true" className="h-16 w-16 shrink-0 bg-primary-content object-contain p-1.5" />
                                </div>

                                <div className="mt-7 space-y-3">
                                    {[
                                        { label: "Slogan", value: schoolInfo.slogan || "The Legit Elites", icon: Sparkles },
                                        { label: "Location", value: schoolInfo.location || "Cape Coast", icon: MapPin },
                                        { label: "Founded", value: String(schoolInfo.founded || "1976"), icon: Landmark },
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={item.label} className="flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-secondary text-secondary-content">
                                                    <Icon size={21} />
                                                </span>
                                                <span>
                                                    <span className="block font-bold">{item.value}</span>
                                                    <span className="mt-1 block text-xs font-bold uppercase tracking-[0.16em] text-primary-content/45">{item.label}</span>
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

            <section className="bg-primary text-primary-content">
                <div className="mx-auto max-w-7xl px-4 py-7">
                    <StaggerChildren className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {schoolFacts.map((fact) => {
                            const Icon = fact.icon;
                            return (
                                <div key={fact.label} className="border border-primary-content/10 bg-primary-content/10 p-5">
                                    <div className="mb-5 flex items-center justify-between">
                                        <Icon size={22} className="text-secondary" />
                                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary-content/35">School</span>
                                    </div>
                                    <p className="text-4xl font-bold leading-none">{fact.value}</p>
                                    <p className="mt-2 text-sm font-medium text-primary-content/55">{fact.label}</p>
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
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">School overview</p>
                            <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">A learning environment with a wider academic culture around it.</h2>
                            <p className="mt-5 leading-relaxed text-base-content/65">
                                {schoolInfo.name}, commonly known as {schoolInfo.abbreviation}, is a co-educational institution located in {schoolInfo.location}. Founded in {schoolInfo.founded}, it continues to produce graduates who carry the school’s name across Ghana and beyond.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="space-y-4">
                        {[
                            "The school benefits from its unique location within a university environment, giving students access to academic resources, mentorship, and a culture of learning.",
                            `With over ${schoolInfo.studentPopulation.toLocaleString()} students and ${schoolInfo.teachingStaff}+ teaching staff, the school combines scale with a deep tradition of discipline and personal development.`,
                            "UPOSA keeps this story alive by connecting old students back to the institution through projects, mentorship, events, and school support.",
                        ].map((copy, index) => (
                            <ScrollReveal key={copy} delay={index * 0.08}>
                                <div className="grid gap-4 border border-base-300 bg-base-100 p-5 shadow-sm md:grid-cols-[84px_1fr]">
                                    <div className="flex h-16 w-16 items-center justify-center bg-primary text-primary-content">
                                        <span className="text-xl font-bold">{String(index + 1).padStart(2, "0")}</span>
                                    </div>
                                    <p className="leading-relaxed text-base-content/68">{copy}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            <section id="programs" className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Programs offered</p>
                                <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">Academic tracks that shape student pathways.</h2>
                            </div>
                            <GraduationCap size={42} className="text-secondary" />
                        </div>
                    </ScrollReveal>

                    <StaggerChildren className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {schoolInfo.programs.map((program, index) => (
                            <Card key={program.name} className="h-full">
                                <CardAccent color={index % 2 === 0 ? "primary" : "secondary"} />
                                <CardBody>
                                    <div className="mb-8 flex items-start justify-between gap-4">
                                        <span className="flex h-14 w-14 items-center justify-center bg-secondary/10 text-secondary">
                                            <GraduationCap size={26} />
                                        </span>
                                        <ArrowUpRight size={18} className="text-base-content/25" />
                                    </div>
                                    <h3 className="text-xl font-bold text-primary">{program.name}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-base-content/60">{program.description}</p>
                                </CardBody>
                            </Card>
                        ))}
                    </StaggerChildren>
                </div>
            </section>

            <section id="achievements" className="bg-base-100 py-16 md:py-24">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                    <ScrollReveal direction="right">
                        <div className="sticky top-24">
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Legacy and achievements</p>
                            <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">Milestones that keep showing up in the school story.</h2>
                            <p className="mt-5 leading-relaxed text-base-content/65">
                                These highlights give old students a shared record of school pride and progress.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="space-y-4">
                        {schoolInfo.achievements.map((achievement, index) => (
                            <ScrollReveal key={`${achievement.year}-${achievement.description}`} delay={index * 0.06}>
                                <div className="grid gap-4 border border-base-300 bg-base-100 p-5 shadow-sm md:grid-cols-[96px_1fr]">
                                    <div className="flex h-20 w-20 items-center justify-center bg-primary text-primary-content">
                                        <span className="text-lg font-bold">{achievement.year}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Milestone</p>
                                        <p className="mt-2 font-semibold leading-relaxed text-primary">{achievement.description}</p>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-primary py-16 text-primary-content md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Notable alumni</p>
                                <h2 className="text-4xl font-bold leading-tight md:text-5xl">Graduates carrying the school into wider spaces.</h2>
                            </div>
                            <Award size={42} className="text-secondary" />
                        </div>
                    </ScrollReveal>

                    <StaggerChildren className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {schoolInfo.notableAlumni.map((alum) => {
                            const initials = alum.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
                            return (
                                <div key={alum.name} className="border border-primary-content/10 bg-primary-content/10 p-5">
                                    <div className="mb-5 flex items-center gap-4">
                                        <div className="flex h-16 w-16 items-center justify-center bg-secondary text-secondary-content">
                                            <span className="text-xl font-bold">{initials}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold">{alum.name}</h3>
                                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-primary-content/40">{alum.yearGroup}</p>
                                        </div>
                                    </div>
                                    <p className="leading-relaxed text-primary-content/65">{alum.achievement}</p>
                                </div>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            <section id="leadership" className="bg-base-100 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">School leadership</p>
                                <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">The team guiding the school’s daily vision.</h2>
                            </div>
                            <Crown size={42} className="text-secondary" />
                        </div>
                    </ScrollReveal>
                    <SchoolLeadershipHierarchy leaders={leaders} />
                </div>
            </section>

            <section id="gallery" className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Gallery</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-tight text-primary md:text-5xl">School moments, spaces, and archives.</h2>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-base-content/60">
                                    A visual record of campus life, alumni gatherings, student achievements, and the spaces that carry the UPSHS story.
                                </p>
                            </div>
                            <div className="border border-primary/10 bg-primary p-5 text-primary-content shadow-sm">
                                <div className="mb-8 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Archive index</p>
                                        <p className="mt-2 text-sm leading-relaxed text-primary-content/65">
                                            {galleryFilter === "All" ? "All published school images" : `${galleryFilter} collection`}
                                        </p>
                                    </div>
                                    <ImageIcon size={34} className="text-secondary" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="border border-primary-content/10 bg-primary-content/10 p-3">
                                        <p className="text-3xl font-bold">{data.gallery.length}</p>
                                        <p className="text-xs uppercase tracking-[0.14em] text-primary-content/60">Total images</p>
                                    </div>
                                    <div className="border border-primary-content/10 bg-primary-content/10 p-3">
                                        <p className="text-3xl font-bold">{filteredGallery.length}</p>
                                        <p className="text-xs uppercase tracking-[0.14em] text-primary-content/60">Showing</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    {data.gallery.length > 0 ? (
                        <>
                            <ScrollReveal>
                                <div className="mb-8 flex flex-wrap gap-2 border-y border-primary/10 py-4">
                                    {galleryCategories.map((filter) => (
                                        <button
                                            key={filter}
                                            type="button"
                                            className={`border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${galleryFilter === filter
                                                ? "border-primary bg-primary text-primary-content shadow-sm"
                                                : "border-primary/15 bg-base-100 text-primary hover:border-secondary hover:text-secondary"
                                            }`}
                                            onClick={() => setGalleryFilter(filter || "All")}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </ScrollReveal>

                            {filteredGallery.length > 0 ? (
                                <div className="grid auto-rows-[260px] gap-0 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredGallery.map((image, index) => (
                                        <GalleryTile key={image.id} image={image} index={index} onOpen={openLightbox} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<ImageIcon />}
                                    title="No images in this collection yet."
                                    description="Choose another gallery category to keep browsing."
                                />
                            )}
                        </>
                    ) : (
                        <EmptyState
                            icon={<GraduationCap />}
                            title="Gallery images coming soon."
                            description="School moments, archive images, and event photos will appear here once they are published."
                        />
                    )}
                </div>
            </section>

            <AnimatePresence>
                {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
                        onClick={closeLightbox}
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            className="relative w-full max-w-4xl overflow-hidden bg-base-100"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="max-h-[70vh] bg-black">
                                <img
                                    src={filteredGallery[lightboxIndex].imageUrl}
                                    alt={filteredGallery[lightboxIndex].title}
                                    onError={(event) => {
                                        event.currentTarget.src = "/logo.png";
                                        event.currentTarget.className = "max-h-[70vh] w-full bg-base-100 p-10 object-contain";
                                    }}
                                    className="max-h-[70vh] w-full object-contain"
                                />
                            </div>
                            <div className="border-t border-base-300 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                                    {filteredGallery[lightboxIndex].category || "Gallery"}
                                </p>
                                <h3 className="mt-1 text-xl font-bold text-primary">{filteredGallery[lightboxIndex].title}</h3>
                                {filteredGallery[lightboxIndex].description && (
                                    <p className="mt-2 text-sm leading-relaxed text-base-content/65">{filteredGallery[lightboxIndex].description}</p>
                                )}
                            </div>
                            <button className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3 bg-base-100/90" onClick={closeLightbox} aria-label="Close gallery image">
                                <X size={18} />
                            </button>
                            {filteredGallery.length > 1 && (
                                <>
                                    <button
                                        className="btn btn-ghost btn-sm btn-circle absolute left-3 top-1/2 -translate-y-1/2 bg-base-100/90"
                                        onClick={(event) => { event.stopPropagation(); prevImage(); }}
                                        aria-label="Previous gallery image"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm btn-circle absolute right-3 top-1/2 -translate-y-1/2 bg-base-100/90"
                                        onClick={(event) => { event.stopPropagation(); nextImage(); }}
                                        aria-label="Next gallery image"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <section className="relative overflow-hidden bg-primary py-16 text-primary-content md:py-24">
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: "linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)",
                        backgroundSize: "42px 42px",
                    }}
                />
                <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-36 -right-16 h-[420px] w-[420px] object-contain opacity-[0.1]" />
                <ScrollReveal>
                    <div className="relative mx-auto max-w-4xl px-4 text-center">
                        <div className="mb-6 inline-flex items-center gap-2 border border-primary-content/12 bg-primary-content/10 px-4 py-2">
                            <School size={14} className="text-secondary" />
                            <span className="text-sm font-semibold text-primary-content/80">School support</span>
                        </div>
                        <h2 className="text-4xl font-bold leading-tight md:text-5xl">Proud of our school? Keep building its legacy.</h2>
                        <p className="mx-auto mt-5 max-w-xl text-primary-content/70">
                            Join UPOSA and help support the next generation of {schoolInfo.name} students.
                        </p>
                        <div className="mt-9 flex flex-wrap justify-center gap-3">
                            <Link to="/membership" className="btn btn-secondary">
                                Join UPOSA
                            </Link>
                            <Link to="/donate" className="btn border-primary-content/20 bg-primary-content/10 text-primary-content hover:bg-primary-content/20">
                                Support the school
                            </Link>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </Layout>
    );
};

export default OurSchool;
