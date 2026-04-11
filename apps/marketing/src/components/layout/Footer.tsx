import { Link, useLocation } from "react-router";
import {
    Mail, Phone, MapPin, Send,
    Info, School, Crown, FileText,
    Newspaper, Calendar, FolderKanban, Heart,
    UserPlus, Search, HandHeart, Briefcase, MessageSquare,
    Building2, Megaphone, Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteData } from "../../context/SiteDataContext.tsx";
import { ScrollReveal } from "../common/ScrollReveal.tsx";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const } }),
};

export const Footer = () => {
    const { data } = useSiteData();
    const social = data?.config.social;
    const contact = data?.config.contact;

    const year = new Date().getFullYear();
    const email = contact?.emails?.general || "info@uposa.org";
    const phones = contact?.phones ? contact.phones.join(" / ") : "0244036676 / 0246446333";
    const address = contact?.address || "University Practice Senior High School, UCC, Cape Coast";

    const socialLinks = [
        { href: social?.facebook, label: "Facebook", icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
        { href: social?.instagram, label: "Instagram", icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> },
        { href: social?.whatsapp, label: "WhatsApp", icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    ];

    const location = useLocation();

    const isLinkActive = (path: string) => {
        const [base, hash] = path.split('#');
        if (base === '/') return location.pathname === '/' && !hash;
        if (location.pathname !== base && !location.pathname.startsWith(base + '/')) return false;
        if (hash) return location.hash === `#${hash}`;
        return !location.hash || location.pathname !== base;
    };

    const linkColumns: { heading: string; icon: LucideIcon; links: [string, string, LucideIcon][] }[] = [
        {
            heading: "Association",
            icon: Building2,
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
                ["/community#forum", "Forum", MessageSquare],
            ],
        },
    ];

    return (
        <footer className="relative bg-[#0B1120] text-white overflow-hidden">
            {/* Animated background dots */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

            {/* Glow accents */}
            <motion.div
                className="absolute -top-20 -right-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.3, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl"
                animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            <div className="relative max-w-7xl mx-auto px-6">

                {/* Top band */}
                <ScrollReveal>
                    <div className="py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border-b border-white/[0.06]">
                        <motion.div className="flex items-center gap-4" whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                            <img src="/logo.png" alt="UPOSA" className="w-12 h-12 rounded-xl" />
                            <div>
                                <p className="text-lg font-bold tracking-tight">UPOSA</p>
                                <p className="text-[11px] text-white/30 tracking-[0.2em] uppercase">The Legit Elites</p>
                            </div>
                        </motion.div>
                        <form className="flex w-full max-w-sm" onSubmit={e => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 h-11 px-4 rounded-l-xl bg-white/[0.06] border border-white/[0.08] border-r-0 text-sm placeholder:text-white/25 focus:outline-none focus:bg-white/[0.1] focus:border-white/[0.15] transition-all"
                            />
                            <motion.button
                                type="submit"
                                className="h-11 px-5 rounded-r-xl bg-secondary text-secondary-content font-semibold text-sm flex items-center gap-1.5"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Subscribe <Send size={13} />
                            </motion.button>
                        </form>
                    </div>
                </ScrollReveal>

                {/* Main grid */}
                <div className="py-12 grid grid-cols-2 lg:grid-cols-12 gap-y-10 gap-x-8">

                    {/* About blurb */}
                    <motion.div
                        className="col-span-2 lg:col-span-4 pr-4"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        custom={0}
                        variants={fadeUp}
                    >
                        <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                            Connecting alumni of University Practice Senior High School. We foster community, support our alma mater, and empower the next generation.
                        </p>
                        <div className="flex gap-2.5 mt-6">
                            {socialLinks.map((s, i) => (
                                <motion.a
                                    key={s.label}
                                    href={s.href || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    className="group w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-secondary/20 flex items-center justify-center transition-colors"
                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                >
                                    <span className="text-white/40 group-hover:text-secondary transition-colors">{s.icon}</span>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Link columns */}
                    {linkColumns.map((col, colIdx) => {
                        const HeaderIcon = col.icon;
                        return (
                            <motion.div
                                key={col.heading}
                                className="lg:col-span-2"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                custom={colIdx + 1}
                                variants={fadeUp}
                            >
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/25 mb-4 flex items-center gap-1.5">
                                    <HeaderIcon size={12} />
                                    {col.heading}
                                </p>
                                <ul className="space-y-2.5">
                                    {col.links.map(([to, label, Icon], linkIdx) => {
                                        const active = isLinkActive(to);
                                        return (
                                            <motion.li
                                                key={to}
                                                initial={{ opacity: 0, x: -8 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.2 + colIdx * 0.1 + linkIdx * 0.05 }}
                                            >
                                                <Link
                                                    to={to}
                                                    className={`text-[13px] inline-flex items-center gap-1.5 hover:text-white hover:translate-x-1 transition-all duration-200 ${
                                                        active ? 'text-secondary font-medium' : 'text-white/45'
                                                    }`}
                                                >
                                                    <Icon size={12} className={`shrink-0 ${active ? 'text-secondary' : 'text-white/25'}`} />
                                                    {label}
                                                </Link>
                                            </motion.li>
                                        );
                                    })}
                                </ul>
                            </motion.div>
                        );
                    })}

                    {/* Contact */}
                    <motion.div
                        className="col-span-2 lg:col-span-2"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        custom={4}
                        variants={fadeUp}
                    >
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/25 mb-4 flex items-center gap-1.5">
                            <Mail size={12} />
                            Contact
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: <Mail size={14} />, text: email, href: `mailto:${email}` },
                                { icon: <Phone size={14} />, text: phones, href: `tel:${(contact?.phones?.[0] || '0244036676').replace(/\s/g, '')}` },
                                { icon: <MapPin size={14} />, text: address, href: undefined },
                            ].map((item, i) => (
                                <motion.li
                                    key={i}
                                    className="flex gap-2 text-[13px] text-white/45"
                                    initial={{ opacity: 0, x: -8 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                >
                                    <span className="shrink-0 mt-0.5 text-white/20">{item.icon}</span>
                                    {item.href ? (
                                        <a href={item.href} className="hover:text-white transition-colors">{item.text}</a>
                                    ) : (
                                        <span>{item.text}</span>
                                    )}
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>

            {/* Bottom */}
            <motion.div
                className="border-t border-white/[0.04]"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
            >
                <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-white/20">&copy; {year} UPOSA &middot; University Practice Old Students' Association</p>
                    <div className="flex gap-5 text-[11px]">
                        {([
                            ["/contact", "Contact Us"],
                            ["/about#constitution", "Constitution"],
                            ["/membership#dues", "Dues"],
                        ] as const).map(([to, label]) => (
                            <Link
                                key={to}
                                to={to}
                                className={`hover:text-white/50 transition-colors ${
                                    isLinkActive(to) ? 'text-secondary/70' : 'text-white/20'
                                }`}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </motion.div>
        </footer>
    );
};
