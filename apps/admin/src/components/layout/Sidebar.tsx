import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  FolderKanban,
  Globe,
  GraduationCap,
  HandCoins,
  Images,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageSquare,
  Newspaper,
  Send,
  Settings,
  ShieldCheck,
  ShieldHalf,
  Sparkles,
  UserCheck,
  Users,
  Vote,
  Wallet,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { usePermission } from '../../hooks/usePermission'
import { useNotificationStore } from '../../stores/notification.store'
import { useUIStore } from '../../stores/ui.store'
import type { Permission } from '../../types'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  permission?: Permission
  notifTypes?: string[]
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Events', to: '/events', icon: Calendar, permission: 'events:view', notifTypes: ['NEW_RSVP'] },
      { label: 'News & Articles', to: '/news', icon: Newspaper, permission: 'news:view' },
      { label: 'Announcements', to: '/announcements', icon: Megaphone, permission: 'announcements:view' },
      { label: 'Projects', to: '/projects', icon: FolderKanban, permission: 'projects:view' },
      { label: 'Donations', to: '/donations', icon: HandCoins, permission: 'donations:view', notifTypes: ['NEW_DONATION'] },
      { label: 'Payment Methods', to: '/payment-methods', icon: Wallet, permission: 'settings:edit' },
      { label: 'Jobs', to: '/jobs', icon: Briefcase, permission: 'jobs:view', notifTypes: ['PENDING_JOB'] },
      { label: 'Gallery', to: '/gallery', icon: Images, permission: 'content:view' },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Forum', to: '/forum', icon: MessageSquare, permission: 'forum:view', notifTypes: ['NEW_FORUM_POST'] },
      { label: 'Polls', to: '/polls', icon: BarChart3, permission: 'polls:view' },
      { label: 'Elections', to: '/elections', icon: Vote, permission: 'elections:view', notifTypes: ['ELECTION_STARTED'] },
    ],
  },
  {
    title: 'Association',
    items: [
      { label: 'Executives', to: '/executives', icon: Crown, permission: 'executives:view' },
      { label: 'School Leaders', to: '/school-leaders', icon: GraduationCap, permission: 'content:view' },
      { label: 'About Content', to: '/about-content', icon: BookOpen, permission: 'content:view' },
    ],
  },
  {
    title: 'Members',
    items: [
      { label: 'Alumni Registrations', to: '/alumni-registrations', icon: UserCheck, permission: 'alumni:view', notifTypes: ['NEW_REGISTRATION'] },
      { label: 'Members Directory', to: '/members', icon: Users, permission: 'members:view' },
      { label: 'Contact Messages', to: '/contact-messages', icon: Mail, permission: 'contact:view', notifTypes: ['NEW_CONTACT_MESSAGE', 'NEW_TRANSCRIPT_REQUEST'] },
      { label: 'Newsletter', to: '/newsletter', icon: Send, permission: 'settings:view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Roles & Permissions', to: '/roles', icon: ShieldHalf, permission: 'roles:view' },
      { label: 'Admin Users', to: '/admin-users', icon: ShieldCheck, permission: 'admin_users:view' },
      { label: 'Site Config', to: '/site-config', icon: Globe, permission: 'settings:edit' },
      { label: 'Settings', to: '/settings', icon: Settings, permission: 'settings:view' },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onCloseMobile: () => void
}

export default function Sidebar({ collapsed, onCloseMobile }: SidebarProps) {
  const { can } = usePermission()
  const notifications = useNotificationStore((s) => s.notifications)
  const { setSidebarCollapsed } = useUIStore()
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const getBadgeCount = (types?: string[]): number => {
    if (!types || types.length === 0) return 0
    return notifications.filter((n) => !n.isRead && types.includes(n.type)).length
  }

  const pathMatches = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`)

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: prev[title] === false }))
  }

  const baseNavClass = collapsed
    ? 'mx-auto grid h-11 w-11 place-items-center'
    : 'flex w-full items-center gap-3 px-3 py-2.5'

  const navClass = (active: boolean, threaded = false) =>
    cn(
      'group relative text-sm font-semibold transition-all duration-200',
      threaded ? 'overflow-visible' : 'overflow-hidden',
      baseNavClass,
      threaded
        && !collapsed
        && 'before:absolute before:-left-[13px] before:top-0 before:h-1/2 before:w-3 before:border-b before:border-l before:border-[#D4AF37]/30 before:content-[""]',
      active
        ? 'bg-[#FFF8DC] text-[#001B50] shadow-[0_14px_34px_rgba(0,0,0,0.18)]'
        : 'text-[#FFF8DC]/62 hover:bg-white/[0.08] hover:text-[#FFF8DC]'
    )

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#001B50] text-[#FFF8DC] shadow-[24px_0_80px_rgba(0,27,80,0.18)]">
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-20 h-64 w-64 object-contain opacity-[0.04]"
      />
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 right-[-7rem] h-80 w-80 object-contain opacity-[0.045]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />

      <div className={cn('relative z-10 flex shrink-0 items-center border-b border-white/10', collapsed ? 'justify-center px-3 py-4' : 'justify-between p-4')}>
        <NavLink to="/dashboard" className={cn('flex min-w-0 items-center gap-3', collapsed && 'justify-center')} onClick={onCloseMobile}>
          <span className="grid h-12 w-12 shrink-0 place-items-center bg-[#FFF8DC] p-1.5 shadow-lg shadow-black/15">
            <img src="/logo.png" alt="UPOSA" className="h-full w-full object-contain" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight">UPOSA Admin</span>
              <span className="mt-0.5 block text-xs text-[#FFF8DC]/50">Secretariat console</span>
            </span>
          )}
        </NavLink>
        {!collapsed && (
          <button
            type="button"
            className="p-1 text-[#FFF8DC]/65 transition-colors hover:bg-white/10 hover:text-[#FFF8DC] lg:hidden"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="relative z-10 mx-4 mt-4 border border-white/10 bg-white/[0.06] p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-[#D4AF37] text-[#001B50]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Legit Elites desk</p>
              <p className="mt-0.5 truncate text-xs text-[#FFF8DC]/45">Publishing, payments, and members</p>
            </div>
          </div>
        </div>
      )}

      <nav className={cn('relative z-10 flex-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => !item.permission || can(item.permission))
          if (visibleItems.length === 0) return null

          const activeSection = visibleItems.some((item) => pathMatches(item.to))
          const sectionExpanded = collapsed || activeSection || expandedSections[section.title] !== false

          return (
            <div key={section.title} className={cn('mb-4', collapsed && 'mb-3')}>
              {collapsed ? (
                <div className="mx-auto mb-2 h-px w-9 bg-white/10" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="mb-2 flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]/70 transition-colors hover:text-[#D4AF37]"
                  aria-expanded={sectionExpanded}
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 text-current/70 transition-transform duration-200',
                      sectionExpanded && 'rotate-180'
                    )}
                  />
                </button>
              )}

              <AnimatePresence initial={false}>
                {sectionExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={cn('space-y-1', !collapsed && 'relative ml-3 border-l border-[#D4AF37]/18 pl-3')}>
                      {visibleItems.map((item) => {
                        const badge = getBadgeCount(item.notifTypes)
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onCloseMobile}
                            title={collapsed ? item.label : undefined}
                            className={({ isActive }) => navClass(isActive || pathMatches(item.to), true)}
                          >
                            <item.icon className="h-[18px] w-[18px] shrink-0" />
                            {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                            {badge > 0 && (
                              collapsed ? (
                                <span className="absolute right-0.5 top-0.5 h-2 w-2 bg-red-500" />
                              ) : (
                                <span className="min-w-[20px] bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                                  {badge > 99 ? '99+' : badge}
                                </span>
                              )
                            )}
                          </NavLink>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      <div className={cn('relative z-10 shrink-0 border-t border-white/10', collapsed ? 'p-3' : 'p-4')}>
        {!collapsed && (
          <div className="mb-3 flex items-center gap-3 border border-white/10 bg-white/[0.05] p-3">
            <span className="grid h-9 w-9 place-items-center bg-white/10 text-[#D4AF37]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-[#FFF8DC]/45">Portal status</p>
              <p className="truncate text-sm font-bold">Admin access active</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!collapsed)}
          className={cn(
            'flex min-h-11 items-center border border-white/10 bg-white/[0.06] text-sm font-bold text-[#FFF8DC]/70 transition-colors hover:border-white/20 hover:bg-white/[0.1] hover:text-[#FFF8DC]',
            collapsed ? 'mx-auto w-11 justify-center' : 'w-full justify-between px-4'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              Collapse panel
              <ChevronsLeft className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
