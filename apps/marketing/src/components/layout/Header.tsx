import { Link, useLocation } from "react-router";
import {
    Menu, X, ChevronDown, Bell,
    Info, School, Crown, Users, FileText,
    UserPlus, Search, CreditCard,
    HandHeart, Briefcase, MessageSquare,
    Newspaper, Calendar, FolderKanban, Megaphone,
    Images,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    children?: NavChild[];
}

const navItems: NavItem[] = [
    { label: "Home", path: "/" },
    {
        label: "About",
        path: "/about",
        children: [
            { label: "The Association", path: "/about", description: "Our mission, vision and history", icon: Info },
            { label: "Our School", path: "/our-school", description: "Programs, achievements and legacy", icon: School },
            { label: "Executive Team", path: "/about#executives", description: "Meet our leadership", icon: Crown },
            { label: "Council Members", path: "/about#council", description: "Year group representatives", icon: Users },
            { label: "Constitution", path: "/about#constitution", description: "Governing documents", icon: FileText },
            { label: "Gallery", path: "/our-school#gallery", description: "Photos and memories", icon: Images },
        ],
    },
    {
        label: "Get Involved",
        path: "/membership",
        children: [
            { label: "Register", path: "/membership", description: "Become a UPOSA member", icon: UserPlus },
            { label: "Alumni Directory", path: "/membership#directory", description: "Find fellow alumni", icon: Search },
            { label: "Dues & Payments", path: "/membership#dues", description: "Manage your membership", icon: CreditCard },
            { label: "Mentorship", path: "/community#mentorship", description: "Connect with mentors", icon: HandHeart },
            { label: "Jobs & Opportunities", path: "/community#jobs", description: "Career openings", icon: Briefcase },
            { label: "Forum & Polls", path: "/community#forum", description: "Discussions and voting", icon: MessageSquare },
        ],
    },
    {
        label: "Updates",
        path: "/news",
        children: [
            { label: "News & Articles", path: "/news", description: "Latest announcements and stories", icon: Newspaper },
            { label: "Events", path: "/events", description: "Upcoming gatherings and reunions", icon: Calendar },
            { label: "Projects", path: "/projects", description: "Ongoing initiatives and fundraising", icon: FolderKanban },
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
        ...(data?.upcomingEvents?.slice(0, 2).map(e => ({
            icon: Calendar,
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-600',
            label: 'Event',
            title: e.title,
            subtitle: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            link: '/events',
        })) || []),
        ...(data?.latestNews?.filter(n => n.category === 'ANNOUNCEMENT').slice(0, 1).map(n => ({
            icon: Megaphone,
            iconBg: 'bg-orange-500/10',
            iconColor: 'text-orange-600',
            label: 'Announcement',
            title: n.title,
            subtitle: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent',
            link: `/news/${n.slug}`,
        })) || []),
        ...(data?.latestNews?.filter(n => n.category !== 'ANNOUNCEMENT').slice(0, 1).map(n => ({
            icon: Newspaper,
            iconBg: 'bg-secondary/10',
            iconColor: 'text-secondary',
            label: 'News',
            title: n.title,
            subtitle: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent',
            link: `/news/${n.slug}`,
        })) || []),
        ...(data?.ongoingProjects?.slice(0, 1).map(p => ({
            icon: FolderKanban,
            iconBg: 'bg-green-500/10',
            iconColor: 'text-green-600',
            label: 'Project',
            title: p.title,
            subtitle: `${Math.round((p.raisedAmount / (p.goalAmount || 1)) * 100)}% funded`,
            link: `/projects/${p.slug}`,
        })) || []),
    ];
    const hasNotifications = notifications.length > 0;

    // Close menus on route change
    useEffect(() => { setMobileOpen(false); setOpenDropdown(null); setNotifOpen(false); }, [location.pathname]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const isActive = (path: string) => {
        const base = path.split('#')[0];
        if (base === '/') return location.pathname === '/';
        return location.pathname === base || location.pathname.startsWith(base + '/');
    };

    const isChildActive = (child: NavChild) => {
        const [base, hash] = child.path.split('#');
        if (base === '/') return location.pathname === '/' && !hash;
        if (location.pathname !== base) return false;
        // If the nav item has a hash, only match when the URL hash matches
        if (hash) return location.hash === `#${hash}`;
        // If the nav item has no hash, only match when the URL also has no hash
        return !location.hash;
    };

    const isGroupActive = (item: NavItem) =>
        item.children ? item.children.some(isChildActive) : isActive(item.path);

    return (
        <header className="sticky top-0 z-50 bg-[#001B50] text-[#FFF8DC] shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 shrink-0">
                        <img src="/logo.png" alt="UPOSA" className="h-9 w-9 rounded-lg object-contain bg-primary-content/10 p-0.5" />
                        <div className="hidden sm:block">
                            <span className="font-bold text-lg leading-none block">UPOSA</span>
                            <span className="text-[10px] text-primary-content/50 tracking-widest">THE LEGIT ELITES</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav ref={dropdownRef} className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => (
                            <div key={item.label} className="relative">
                                {item.children ? (
                                    <>
                                        <button
                                            onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isGroupActive(item) ? 'bg-primary-content/15' : 'hover:bg-primary-content/10'
                                            }`}
                                        >
                                            {item.label}
                                            <ChevronDown size={14} className={`transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {openDropdown === item.label && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute top-full left-0 mt-2 w-72 bg-base-100 text-base-content rounded-2xl shadow-2xl border border-base-300 overflow-hidden z-50 p-2"
                                                >
                                                    {item.children.map((child) => {
                                                        const Icon = child.icon;
                                                        return (
                                                            <Link
                                                                key={child.label}
                                                                to={child.path}
                                                                onClick={() => setOpenDropdown(null)}
                                                                className={`flex items-start gap-3 px-3 py-3 rounded-xl transition-colors group ${
                                                                    isChildActive(child) ? 'bg-secondary/10' : 'hover:bg-base-200'
                                                                }`}
                                                            >
                                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                                                    isChildActive(child) ? 'bg-secondary/20' : 'bg-secondary/10 group-hover:bg-secondary/20'
                                                                }`}>
                                                                    <Icon size={16} className="text-secondary" />
                                                                </div>
                                                                <div>
                                                                    <p className={`text-sm font-semibold ${isChildActive(child) ? 'text-secondary' : ''}`}>{child.label}</p>
                                                                    <p className="text-xs text-base-content/50 mt-0.5">{child.description}</p>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                ) : (
                                    <Link
                                        to={item.path}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive(item.path) ? 'bg-primary-content/15' : 'hover:bg-primary-content/10'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        {/* Notification bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative"
                                onClick={() => setNotifOpen(!notifOpen)}
                                aria-label="Notifications"
                            >
                                <Bell size={16} />
                                {hasNotifications && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full ring-2 ring-[#001B50]" />
                                )}
                            </button>
                            <AnimatePresence>
                                {notifOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full right-0 mt-2 w-80 bg-base-100 text-base-content rounded-2xl shadow-2xl border border-base-300 overflow-hidden z-50"
                                    >
                                        <div className="px-4 py-3 border-b border-base-300 flex items-center justify-between">
                                            <h4 className="font-semibold text-sm">What's New</h4>
                                            <span className="text-xs text-base-content/40">{notifications.length} updates</span>
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <p className="text-sm text-base-content/40 text-center py-6">No updates right now</p>
                                            ) : (
                                                notifications.map((n, i) => {
                                                    const Icon = n.icon;
                                                    return (
                                                        <Link
                                                            key={i}
                                                            to={n.link}
                                                            onClick={() => setNotifOpen(false)}
                                                            className="flex items-start gap-3 px-4 py-3 hover:bg-base-200 transition-colors border-b border-base-300/50 last:border-0"
                                                        >
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.iconBg}`}>
                                                                <Icon size={14} className={n.iconColor} />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-medium truncate flex-1">{n.title}</p>
                                                                    <span className="text-[10px] text-base-content/30 uppercase tracking-wide shrink-0">{n.label}</span>
                                                                </div>
                                                                <p className="text-xs text-base-content/40">{n.subtitle}</p>
                                                            </div>
                                                        </Link>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <div className="px-4 py-2.5 border-t border-base-300 bg-base-200/50">
                                            <Link to="/news" onClick={() => setNotifOpen(false)} className="text-xs text-primary font-medium hover:underline">View all updates</Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <Link to="/donate" className="btn btn-secondary btn-sm h-9 min-h-0 hidden sm:flex">Donate</Link>
                        <Link to="/membership" className="btn btn-sm h-9 min-h-0 bg-[#FFF8DC] text-[#001B50] hover:bg-white/90 border-0 hidden sm:flex">Register</Link>
                        <button
                            className="w-9 h-9 rounded-lg bg-primary-content/10 hover:bg-primary-content/20 flex items-center justify-center transition-colors lg:hidden"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="lg:hidden border-t border-primary-content/10 overflow-hidden"
                    >
                        <div className="py-3 px-4 max-h-[80vh] overflow-y-auto space-y-1">
                            {navItems.map((item, i) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    {item.children ? (
                                        <div>
                                            <button
                                                onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                    isGroupActive(item) ? 'bg-primary-content/15' : 'hover:bg-primary-content/10'
                                                }`}
                                            >
                                                {item.label}
                                                <ChevronDown size={14} className={`transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {openDropdown === item.label && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: "auto" }}
                                                        exit={{ height: 0 }}
                                                        className="overflow-hidden ml-4 border-l-2 border-primary-content/10"
                                                    >
                                                        {item.children.map((child) => {
                                                            const Icon = child.icon;
                                                            return (
                                                                <Link
                                                                    key={child.label}
                                                                    to={child.path}
                                                                    onClick={() => setMobileOpen(false)}
                                                                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                                                        isChildActive(child)
                                                                            ? 'text-primary-content bg-primary-content/10 rounded-lg'
                                                                            : 'text-primary-content/70 hover:text-primary-content'
                                                                    }`}
                                                                >
                                                                    <Icon size={14} className={`shrink-0 ${isChildActive(child) ? 'text-secondary' : 'text-secondary'}`} />
                                                                    {child.label}
                                                                </Link>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            onClick={() => setMobileOpen(false)}
                                            className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                isActive(item.path) ? 'bg-primary-content/15' : 'hover:bg-primary-content/10'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
                                </motion.div>
                            ))}
                            <motion.div
                                className="flex gap-2 pt-3 mt-2 border-t border-primary-content/10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Link to="/donate" className="btn btn-secondary btn-sm flex-1" onClick={() => setMobileOpen(false)}>Donate</Link>
                                <Link to="/membership" className="btn btn-sm flex-1 bg-[#FFF8DC] text-[#001B50] border-0" onClick={() => setMobileOpen(false)}>Register</Link>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};
