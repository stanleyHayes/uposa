import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import {
    ArrowRight,
    Briefcase,
    Camera,
    Calendar,
    CheckCircle2,
    Crown,
    ExternalLink,
    FileText,
    FolderKanban,
    HandHeart,
    Heart,
    Info,
    Mail,
    MapPin,
    Megaphone,
    MessageCircle,
    Newspaper,
    Phone,
    School,
    Search,
    Send,
    UserPlus,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteData } from "../../context/SiteDataContext.tsx";
import { ScrollReveal } from "../common/ScrollReveal.tsx";
import { subscribeNewsletter } from "../../api/client.ts";
import { SkeletonBlock } from "../common/Skeleton.tsx";

const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.08, duration: 0.45, ease: "easeOut" as const },
    }),
};

function formValue(formData: FormData, key: string) {
    return String(formData.get(key) || "").trim();
}

export const Footer = () => {
    const { data } = useSiteData();
    const social = data?.config.social;
    const contact = data?.config.contact;
    const location = useLocation();
    const [newsletterDone, setNewsletterDone] = useState(false);
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [newsletterError, setNewsletterError] = useState("");

    const year = new Date().getFullYear();
    const email = contact?.emails?.general || "info@uposa.org";
    const phones = contact?.phones?.length ? contact.phones.join(" / ") : "0244036676 / 0246446333";
    const primaryPhone = contact?.phones?.[0] || "0244036676";
    const address = contact?.address || "University Practice Senior High School, UCC, Cape Coast";

    const socialLinks = [
        { href: social?.facebook, label: "Facebook", icon: Users },
        { href: social?.instagram, label: "Instagram", icon: Camera },
        { href: social?.whatsapp, label: "WhatsApp", icon: MessageCircle },
    ];

    const isLinkActive = (path: string) => {
        const [base, hash] = path.split("#");
        if (base === "/") return location.pathname === "/" && !hash;
        if (location.pathname !== base && !location.pathname.startsWith(`${base}/`)) return false;
        if (hash) return location.hash === `#${hash}`;
        return !location.hash || location.pathname !== base;
    };

    const linkColumns: { heading: string; icon: LucideIcon; links: [string, string, LucideIcon][] }[] = [
        {
            heading: "Association",
            icon: School,
            links: [
                ["/about", "About", Info],
                ["/our-school", "Our School", School],
                ["/about#executives", "Executives", Crown],
                ["/about#constitution", "Constitution", FileText],
            ],
        },
        {
            heading: "Updates",
            icon: Megaphone,
            links: [
                ["/news", "News", Newspaper],
                ["/events", "Events", Calendar],
                ["/projects", "Projects", FolderKanban],
                ["/donate", "Donate", Heart],
            ],
        },
        {
            heading: "Community",
            icon: Users,
            links: [
                ["/membership", "Register", UserPlus],
                ["/membership#directory", "Directory", Search],
                ["/community#mentorship", "Mentorship", HandHeart],
                ["/community#jobs", "Jobs", Briefcase],
                ["/community#forum", "Forum", MessageCircle],
            ],
        },
    ];

    const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setNewsletterLoading(true);
        setNewsletterError("");
        const formData = new FormData(event.currentTarget);

        try {
            await subscribeNewsletter(formValue(formData, "email"));
            setNewsletterDone(true);
            event.currentTarget.reset();
        } catch (err) {
            setNewsletterError(err instanceof Error ? err.message : "Failed to subscribe");
        } finally {
            setNewsletterLoading(false);
        }
    };

    return (
        <footer className="relative overflow-hidden bg-primary text-primary-content">
            <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: "linear-gradient(90deg, var(--uposa-nav-grid) 1px, transparent 1px), linear-gradient(var(--uposa-nav-grid) 1px, transparent 1px)",
                    backgroundSize: "42px 42px",
                }}
            />
            <img
                src="/logo.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 top-10 h-[460px] w-[460px] object-contain opacity-[0.05] md:h-[620px] md:w-[620px]"
            />

            <div className="relative mx-auto max-w-7xl px-4">
                <ScrollReveal>
                    <div className="grid gap-8 border-b border-primary-content/10 py-12 md:grid-cols-[1fr_460px] md:items-center">
                        <div className="max-w-2xl">
                            <div className="mb-6 inline-flex items-center gap-3 border border-primary-content/10 bg-primary-content/10 px-4 py-2">
                                <img src="/logo.png" alt="UPOSA crest" className="h-10 w-10 bg-primary-content/10 object-contain p-1" />
                                <div>
                                    <p className="text-sm font-bold">UPOSA</p>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-content/40">The Legit Elites</p>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold leading-tight md:text-4xl">Stay close to the association desk.</h2>
                            <p className="mt-4 max-w-xl leading-relaxed text-primary-content/60">
                                Get announcements on events, dues, projects, school support, and alumni stories straight from UPOSA.
                            </p>
                        </div>

                        <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                            {newsletterDone ? (
                                <div className="flex items-start gap-4">
                                    <div className="grid h-12 w-12 shrink-0 place-items-center bg-secondary text-secondary-content">
                                        <CheckCircle2 size={22} />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">You are subscribed.</p>
                                        <p className="mt-1 text-sm leading-relaxed text-primary-content/55">We will keep you posted on the next UPOSA update.</p>
                                    </div>
                                </div>
                            ) : (
                                <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleNewsletterSubmit}>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Your email address"
                                        className="input input-bordered border-primary-content/10 bg-primary-content/10 text-primary-content placeholder:text-primary-content/40"
                                        required
                                    />
                                    <button type="submit" className="btn btn-secondary" disabled={newsletterLoading}>
                                        {newsletterLoading ? <SkeletonBlock className="h-4 w-24 bg-secondary-content/25" /> : <>Subscribe <Send size={15} /></>}
                                    </button>
                                    {newsletterError && <p className="text-sm font-semibold text-error sm:col-span-2">{newsletterError}</p>}
                                </form>
                            )}
                        </div>
                    </div>
                </ScrollReveal>

                <div className="grid gap-10 border-b border-primary-content/10 py-12 lg:grid-cols-[1.1fr_1.45fr_0.95fr]">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        custom={0}
                        variants={fadeUp}
                    >
                        <p className="text-sm leading-relaxed text-primary-content/60">
                            Connecting alumni of University Practice Senior High School, strengthening year groups, supporting school projects, and opening useful community pathways for old students.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-2">
                            {socialLinks.map((socialLink) => {
                                const Icon = socialLink.icon;
                                return (
                                    <a
                                        key={socialLink.label}
                                        href={socialLink.href || "#"}
                                        target={socialLink.href ? "_blank" : undefined}
                                        rel={socialLink.href ? "noopener noreferrer" : undefined}
                                        aria-label={socialLink.label}
                                        className="group inline-flex h-11 w-11 items-center justify-center border border-primary-content/10 bg-primary-content/10 transition hover:bg-secondary hover:text-secondary-content"
                                    >
                                        <Icon size={18} className="transition group-hover:scale-110" />
                                    </a>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link to="/membership" className="btn btn-secondary btn-sm">
                                Register <ArrowRight size={15} />
                            </Link>
                            <Link to="/donate" className="btn btn-ghost btn-sm text-primary-content hover:bg-primary-content/10">
                                Donate
                            </Link>
                        </div>
                    </motion.div>

                    <div className="grid gap-8 sm:grid-cols-3">
                        {linkColumns.map((column, columnIndex) => {
                            const HeaderIcon = column.icon;
                            return (
                                <motion.div
                                    key={column.heading}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-50px" }}
                                    custom={columnIndex + 1}
                                    variants={fadeUp}
                                >
                                    <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                                        <HeaderIcon size={14} />
                                        {column.heading}
                                    </p>
                                    <ul className="space-y-2">
                                        {column.links.map(([to, label, Icon]) => {
                                            const active = isLinkActive(to);
                                            return (
                                                <li key={to}>
                                                    <Link
                                                        to={to}
                                                        className={`group flex items-center justify-between gap-3 border border-transparent px-0 py-2 text-sm font-semibold transition ${
                                                            active ? "text-secondary" : "text-primary-content/55 hover:text-primary-content"
                                                        }`}
                                                    >
                                                        <span className="inline-flex items-center gap-2">
                                                            <Icon size={14} className={active ? "text-secondary" : "text-primary-content/30 group-hover:text-secondary"} />
                                                            {label}
                                                        </span>
                                                        <ArrowRight size={13} className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </motion.div>
                            );
                        })}
                    </div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        custom={4}
                        variants={fadeUp}
                    >
                        <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                            <Mail size={14} />
                            Contact
                        </p>
                        <div className="space-y-3">
                            {[
                                { icon: Mail, text: email, href: `mailto:${email}` },
                                { icon: Phone, text: phones, href: `tel:${primaryPhone.replace(/\s/g, "")}` },
                                { icon: MapPin, text: address, href: undefined },
                            ].map((item) => {
                                const Icon = item.icon;
                                const content = (
                                    <>
                                        <span className="grid h-10 w-10 shrink-0 place-items-center bg-primary-content/10 text-secondary">
                                            <Icon size={16} />
                                        </span>
                                        <span className="min-w-0 flex-1 text-sm leading-relaxed text-primary-content/60">{item.text}</span>
                                        {item.href && <ExternalLink size={13} className="shrink-0 text-primary-content/25" />}
                                    </>
                                );

                                return item.href ? (
                                    <a key={item.text} href={item.href} className="group flex items-start gap-3 border border-primary-content/10 bg-primary-content/5 p-3 transition hover:bg-primary-content/10">
                                        {content}
                                    </a>
                                ) : (
                                    <div key={item.text} className="flex items-start gap-3 border border-primary-content/10 bg-primary-content/5 p-3">
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="relative mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-primary-content/35 sm:flex-row sm:items-center sm:justify-between">
                <p>&copy; {year} UPOSA. University Practice Old Students' Association.</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {([
                        ["/contact", "Contact"],
                        ["/about#constitution", "Constitution"],
                        ["/membership#dues", "Dues"],
                    ] as const).map(([to, label]) => (
                        <Link key={to} to={to} className={isLinkActive(to) ? "text-secondary" : "hover:text-primary-content/70"}>
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </footer>
    );
};
