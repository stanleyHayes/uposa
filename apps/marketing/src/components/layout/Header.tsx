import { Link, useLocation } from "react-router";
import {
    Bell,
    Briefcase,
    Calendar,
    ChevronDown,
    ChevronRight,
    Crown,
    CreditCard,
    FileText,
    FolderKanban,
    HandHeart,
    Images,
    Info,
    Landmark,
    LayoutPanelTop,
    Megaphone,
    Menu,
    MessageSquare,
    Newspaper,
    PanelTop,
    School,
    Search,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useSiteData } from "../../context/SiteDataContext.tsx";

interface NavChild {
    label: string;
    path: string;
    description: string;
    icon: LucideIcon;
}

interface NavItem {
    label: string;
    path: string;
    summary?: string;
    icon?: LucideIcon;
    children?: NavChild[];
}

const navItems: NavItem[] = [
    { label: "Home", path: "/" },
    {
        label: "About",
        path: "/about",
        summary: "Association history, school story, leaders, and governance.",
        icon: Landmark,
        children: [
            { label: "The Association", path: "/about", description: "Mission, vision, and history", icon: Info },
            { label: "Our School", path: "/our-school", description: "Programs, achievements, and legacy", icon: School },
            { label: "Executive Team", path: "/about#executives", description: "Meet the UPOSA leadership", icon: Crown },
            { label: "Council Members", path: "/about#council", description: "Year-group representatives", icon: Users },
            { label: "Constitution", path: "/about#constitution", description: "Governing documents", icon: FileText },
            { label: "Gallery", path: "/our-school#gallery", description: "Photos and school memories", icon: Images },
        ],
    },
    {
        label: "Get Involved",
        path: "/membership",
        summary: "Register, pay dues, connect, mentor, and participate.",
        icon: UserPlus,
        children: [
            { label: "Register", path: "/membership", description: "Become a UPOSA member", icon: UserPlus },
            { label: "Alumni Directory", path: "/membership#directory", description: "Find fellow alumni", icon: Search },
            { label: "Dues & Payments", path: "/membership#dues", description: "Manage membership payments", icon: CreditCard },
            { label: "Mentorship", path: "/community#mentorship", description: "Connect with mentors", icon: HandHeart },
            { label: "Jobs & Opportunities", path: "/community#jobs", description: "Career openings and leads", icon: Briefcase },
            { label: "Forum & Polls", path: "/community#forum", description: "Discussions, polls, and voting", icon: MessageSquare },
        ],
    },
    {
        label: "Updates",
        path: "/news",
        summary: "Follow association news, events, projects, and public notices.",
        icon: LayoutPanelTop,
        children: [
            { label: "News & Articles", path: "/news", description: "Announcements and stories", icon: Newspaper },
            { label: "Events", path: "/events", description: "Gatherings, reunions, and RSVP", icon: Calendar },
            { label: "Projects", path: "/projects", description: "Initiatives and fundraising", icon: FolderKanban },
        ],
    },
    { label: "Contact", path: "/contact" },
];

export const Header = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [notifOpen, setNotifOpen] = useState(false);
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const { data } = useSiteData();

    const notifications = [
        ...(data?.upcomingEvents?.slice(0, 2).map((event) => ({
            icon: Calendar,
            iconBg: "bg-primary/5",
            iconColor: "text-primary",
            label: "Event",
            title: event.title,
            subtitle: new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            link: "/events",
        })) || []),
        ...(data?.latestNews?.filter((article) => article.category === "ANNOUNCEMENT").slice(0, 1).map((article) => ({
            icon: Megaphone,
            iconBg: "bg-secondary/10",
            iconColor: "text-secondary",
            label: "Announcement",
            title: article.title,
            subtitle: article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent",
            link: `/news/${article.slug}`,
        })) || []),
        ...(data?.latestNews?.filter((article) => article.category !== "ANNOUNCEMENT").slice(0, 1).map((article) => ({
            icon: Newspaper,
            iconBg: "bg-primary/5",
            iconColor: "text-primary",
            label: "News",
            title: article.title,
            subtitle: article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent",
            link: `/news/${article.slug}`,
        })) || []),
        ...(data?.ongoingProjects?.slice(0, 1).map((project) => ({
            icon: FolderKanban,
            iconBg: "bg-secondary/10",
            iconColor: "text-secondary",
            label: "Project",
            title: project.title,
            subtitle: `${Math.round((project.raisedAmount / (project.goalAmount || 1)) * 100)}% funded`,
            link: `/projects/${project.slug}`,
        })) || []),
    ];
    const hasNotifications = notifications.length > 0;

    useEffect(() => {
        setMobileOpen(false);
        setOpenDropdown(null);
        setNotifOpen(false);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setNotifOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const isActive = (path: string) => {
        const base = path.split("#")[0];
        if (base === "/") return location.pathname === "/";
        return location.pathname === base || location.pathname.startsWith(`${base}/`);
    };

    const isChildActive = (child: NavChild) => {
        const [base, hash] = child.path.split("#");
        if (base === "/") return location.pathname === "/" && !hash;
        if (location.pathname !== base) return false;
        if (hash) return location.hash === `#${hash}`;
        return !location.hash;
    };

    const isGroupActive = (item: NavItem) =>
        item.children ? item.children.some(isChildActive) || isActive(item.path) : isActive(item.path);

    return (
        <header className="sticky top-0 z-50 border-b border-primary-content/10 bg-primary text-primary-content shadow-[0_12px_40px_rgba(0,27,80,0.22)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-secondary" />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: "linear-gradient(90deg, #FFF8DC 1px, transparent 1px), linear-gradient(#FFF8DC 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative mx-auto max-w-7xl px-4">
                <div className="flex min-h-[72px] items-center justify-between gap-4 py-3">
                    <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center border border-primary-content/10 bg-primary-content/10">
                            <img src="/logo.png" alt="UPOSA" className="h-10 w-10 object-contain" />
                        </span>
                        <span className="hidden sm:block">
                            <span className="block text-lg font-bold leading-none tracking-wide">UPOSA</span>
                            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-primary-content/45">The Legit Elites</span>
                        </span>
                    </Link>

                    <nav ref={dropdownRef} className="hidden items-center gap-1 lg:flex">
                        {navItems.map((item) => (
                            <div key={item.label} className="relative">
                                {item.children ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                                            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-bold transition-colors ${
                                                isGroupActive(item) ? "bg-primary-content/15 text-primary-content" : "text-primary-content/70 hover:bg-primary-content/10 hover:text-primary-content"
                                            }`}
                                            aria-expanded={openDropdown === item.label}
                                        >
                                            {item.label}
                                            <ChevronDown size={14} className={`transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                                        </button>
                                        <AnimatePresence>
                                            {openDropdown === item.label && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ duration: 0.16 }}
                                                    className="absolute left-0 top-full z-50 mt-3 w-[520px] border border-base-300 bg-base-100 p-3 text-base-content shadow-2xl"
                                                >
                                                    <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                                                        <Link
                                                            to={item.path}
                                                            onClick={() => setOpenDropdown(null)}
                                                            className="flex min-h-full flex-col justify-between bg-primary p-4 text-primary-content transition hover:bg-primary/95"
                                                        >
                                                            <div>
                                                                <div className="mb-5 grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                                                    {item.icon ? <item.icon size={22} /> : <PanelTop size={22} />}
                                                                </div>
                                                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Navigate</p>
                                                                <h3 className="mt-2 text-2xl font-bold">{item.label}</h3>
                                                                <p className="mt-3 text-sm leading-relaxed text-primary-content/55">{item.summary}</p>
                                                            </div>
                                                            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-secondary">
                                                                Open section <ChevronRight size={15} />
                                                            </span>
                                                        </Link>

                                                        <div className="grid gap-1">
                                                            {item.children.map((child) => {
                                                                const Icon = child.icon;
                                                                const active = isChildActive(child);
                                                                return (
                                                                    <Link
                                                                        key={child.label}
                                                                        to={child.path}
                                                                        onClick={() => setOpenDropdown(null)}
                                                                        className={`group grid grid-cols-[44px_1fr_auto] items-center gap-3 p-3 transition-colors ${
                                                                            active ? "bg-secondary/10" : "hover:bg-base-200"
                                                                        }`}
                                                                    >
                                                                        <span className={`grid h-11 w-11 place-items-center ${active ? "bg-secondary text-secondary-content" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-content"}`}>
                                                                            <Icon size={17} />
                                                                        </span>
                                                                        <span className="min-w-0">
                                                                            <span className={`block text-sm font-bold ${active ? "text-secondary" : "text-primary"}`}>{child.label}</span>
                                                                            <span className="mt-0.5 block text-xs leading-relaxed text-base-content/50">{child.description}</span>
                                                                        </span>
                                                                        <ChevronRight size={15} className="text-base-content/25 transition group-hover:translate-x-1 group-hover:text-secondary" />
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                ) : (
                                    <Link
                                        to={item.path}
                                        className={`block px-3.5 py-2.5 text-sm font-bold transition-colors ${
                                            isActive(item.path) ? "bg-primary-content/15 text-primary-content" : "text-primary-content/70 hover:bg-primary-content/10 hover:text-primary-content"
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <div className="relative" ref={notifRef}>
                            <button
                                type="button"
                                className="relative grid h-10 w-10 place-items-center border border-primary-content/10 bg-primary-content/10 transition hover:bg-primary-content/15"
                                onClick={() => setNotifOpen(!notifOpen)}
                                aria-label="Notifications"
                                aria-expanded={notifOpen}
                            >
                                <Bell size={17} />
                                {hasNotifications && (
                                    <span className="absolute right-2 top-2 h-2 w-2 bg-secondary ring-2 ring-primary" />
                                )}
                            </button>
                            <AnimatePresence>
                                {notifOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.16 }}
                                        className="absolute right-0 top-full z-50 mt-3 w-[min(88vw,360px)] border border-base-300 bg-base-100 text-base-content shadow-2xl"
                                    >
                                        <div className="border-b border-base-300 bg-primary p-4 text-primary-content">
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Latest desk</p>
                                            <div className="mt-2 flex items-center justify-between gap-3">
                                                <h4 className="text-lg font-bold">What's new</h4>
                                                <span className="text-xs font-bold text-primary-content/45">{notifications.length} updates</span>
                                            </div>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto p-2">
                                            {notifications.length === 0 ? (
                                                <p className="px-4 py-8 text-center text-sm text-base-content/45">No updates right now</p>
                                            ) : (
                                                notifications.map((notification, index) => {
                                                    const Icon = notification.icon;
                                                    return (
                                                        <Link
                                                            key={`${notification.label}-${index}`}
                                                            to={notification.link}
                                                            onClick={() => setNotifOpen(false)}
                                                            className="group grid grid-cols-[42px_1fr] gap-3 border-b border-base-300/60 p-3 transition last:border-0 hover:bg-base-200"
                                                        >
                                                            <span className={`grid h-10 w-10 place-items-center ${notification.iconBg}`}>
                                                                <Icon size={16} className={notification.iconColor} />
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="flex items-center gap-2">
                                                                    <span className="truncate text-sm font-bold text-primary">{notification.title}</span>
                                                                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-base-content/30">{notification.label}</span>
                                                                </span>
                                                                <span className="mt-1 block text-xs text-base-content/45">{notification.subtitle}</span>
                                                            </span>
                                                        </Link>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <div className="border-t border-base-300 bg-base-200 px-4 py-3">
                                            <Link to="/news" onClick={() => setNotifOpen(false)} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-secondary">
                                                View all updates <ChevronRight size={13} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <Link to="/donate" className="btn btn-secondary btn-sm hidden min-h-10 border-0 px-4 sm:inline-flex">
                            Donate
                        </Link>
                        <Link to="/membership" className="btn btn-sm hidden min-h-10 border-primary-content/20 bg-primary-content text-primary hover:bg-white sm:inline-flex">
                            Register
                        </Link>
                        <button
                            type="button"
                            className="grid h-10 w-10 place-items-center border border-primary-content/10 bg-primary-content/10 transition hover:bg-primary-content/15 lg:hidden"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                            aria-expanded={mobileOpen}
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="relative overflow-hidden border-t border-primary-content/10 lg:hidden"
                    >
                        <div className="max-h-[80vh] space-y-2 overflow-y-auto px-4 py-4">
                            {navItems.map((item, index) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    {item.children ? (
                                        <div className="border border-primary-content/10 bg-primary-content/5">
                                            <button
                                                type="button"
                                                onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                                                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold transition-colors ${
                                                    isGroupActive(item) ? "bg-primary-content/15" : "hover:bg-primary-content/10"
                                                }`}
                                            >
                                                <span>
                                                    <span className="block">{item.label}</span>
                                                    <span className="mt-1 block text-xs font-semibold text-primary-content/40">{item.summary}</span>
                                                </span>
                                                <ChevronDown size={16} className={`shrink-0 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                                            </button>
                                            <AnimatePresence>
                                                {openDropdown === item.label && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: "auto" }}
                                                        exit={{ height: 0 }}
                                                        className="overflow-hidden border-t border-primary-content/10 bg-primary-content/[0.03]"
                                                    >
                                                        <div className="grid gap-1 p-2">
                                                            {item.children.map((child) => {
                                                                const Icon = child.icon;
                                                                const active = isChildActive(child);
                                                                return (
                                                                    <Link
                                                                        key={child.label}
                                                                        to={child.path}
                                                                        onClick={() => setMobileOpen(false)}
                                                                        className={`grid grid-cols-[36px_1fr] gap-3 p-3 text-sm transition-colors ${
                                                                            active ? "bg-primary-content/15 text-primary-content" : "text-primary-content/70 hover:bg-primary-content/10 hover:text-primary-content"
                                                                        }`}
                                                                    >
                                                                        <span className="grid h-9 w-9 place-items-center bg-secondary text-secondary-content">
                                                                            <Icon size={15} />
                                                                        </span>
                                                                        <span>
                                                                            <span className="block font-bold">{child.label}</span>
                                                                            <span className="mt-0.5 block text-xs leading-relaxed text-primary-content/40">{child.description}</span>
                                                                        </span>
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            onClick={() => setMobileOpen(false)}
                                            className={`block border border-primary-content/10 px-4 py-3 text-sm font-bold transition-colors ${
                                                isActive(item.path) ? "bg-primary-content/15" : "bg-primary-content/5 hover:bg-primary-content/10"
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
                                </motion.div>
                            ))}
                            <motion.div
                                className="grid grid-cols-2 gap-2 border-t border-primary-content/10 pt-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Link to="/donate" className="btn btn-secondary btn-sm" onClick={() => setMobileOpen(false)}>
                                    Donate
                                </Link>
                                <Link to="/membership" className="btn btn-sm border-0 bg-primary-content text-primary" onClick={() => setMobileOpen(false)}>
                                    Register
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};
