import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import {
  BarChart3,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  FileText,
  FolderOpen,
  Handshake,
  Heart,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Newspaper,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Vote,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../stores/ui.store'
import { cn } from '../../utils/cn'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/profile', label: 'My Profile', icon: User },
    ],
  },
  {
    title: 'Content',
    items: [
      { to: '/news', label: 'News', icon: Newspaper },
      { to: '/events', label: 'Events', icon: Calendar },
      { to: '/projects', label: 'Projects', icon: FolderOpen },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/donations', label: 'Donations', icon: Heart },
      { to: '/dues', label: 'My Dues', icon: CreditCard },
    ],
  },
  {
    title: 'Community',
    items: [
      { to: '/jobs', label: 'Jobs Board', icon: Briefcase },
      { to: '/mentorship', label: 'Mentorship', icon: Handshake },
      { to: '/members', label: 'Directory', icon: Users },
      { to: '/forum', label: 'Forum', icon: MessageSquare },
    ],
  },
  {
    title: 'Governance',
    items: [
      { to: '/polls', label: 'Polls', icon: BarChart3 },
      { to: '/elections', label: 'Elections', icon: Vote },
    ],
  },
  {
    title: 'Support',
    items: [
      { to: '/requests', label: 'Requests', icon: FileText },
      { to: '/contact', label: 'Contact', icon: Mail },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapse } = useUIStore()
  const location = useLocation()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const collapsed = sidebarCollapsed

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: prev[title] === false }))
  }

  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => location.pathname.startsWith(item.to))

  const baseNavClass = collapsed
    ? 'mx-auto grid h-11 w-11 place-items-center'
    : 'flex w-full items-center gap-3 px-3 py-2.5'

  const navClass = (active: boolean, threaded = false) =>
    cn(
      'group relative text-sm font-semibold transition-all duration-200',
      threaded ? 'overflow-visible' : 'overflow-hidden',
      collapsed ? 'rounded-[14px_3px_14px_3px]' : 'rounded-[16px_3px_16px_3px]',
      baseNavClass,
      threaded
        && !collapsed
        && 'before:absolute before:-left-[13px] before:top-0 before:h-1/2 before:w-3 before:rounded-bl-[12px] before:border-b before:border-l before:border-[#D4AF37]/30 before:content-[""]',
      active
        ? 'bg-[#FFF8DC] text-[#001B50] shadow-[0_14px_34px_rgba(0,0,0,0.18)]'
        : 'text-[#FFF8DC]/62 hover:bg-white/[0.08] hover:text-[#FFF8DC]'
    )

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            type="button"
            className="fixed inset-0 z-30 bg-[#001B50]/55 backdrop-blur-sm lg:hidden"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col overflow-hidden border-r border-white/10 bg-[#001B50] text-[#FFF8DC] shadow-[24px_0_80px_rgba(0,27,80,0.18)] transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[86px]' : 'lg:w-[286px]',
          'w-[286px]'
        )}
        layout
      >
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
          <NavLink to="/dashboard" className={cn('flex min-w-0 items-center gap-3', collapsed && 'justify-center')} onClick={() => setSidebarOpen(false)}>
            <span className="grid h-12 w-12 shrink-0 place-items-center bg-[#FFF8DC] p-1.5 shadow-lg shadow-black/15 rounded-[16px_3px_16px_3px]">
              <img src="/logo.png" alt="UPOSA" className="h-full w-full object-contain" />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold leading-tight">UPOSA Alumni</span>
                <span className="mt-0.5 block text-xs text-[#FFF8DC]/50">Member workspace</span>
              </span>
            )}
          </NavLink>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square text-[#FFF8DC]/65 hover:bg-white/10 hover:text-[#FFF8DC] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!collapsed && (
          <div className="relative z-10 mx-4 mt-4 border border-white/10 bg-white/[0.06] p-3 rounded-[18px_3px_18px_3px]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center bg-[#D4AF37] text-[#001B50] rounded-[14px_3px_14px_3px]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">Legit Elites desk</p>
                <p className="mt-0.5 truncate text-xs text-[#FFF8DC]/45">Dues, updates, and community</p>
              </div>
            </div>
          </div>
        )}

        <nav className={cn('relative z-10 flex-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
          {navGroups.map((group) => {
            const activeGroup = isGroupActive(group)
            const groupExpanded = collapsed || activeGroup || expandedGroups[group.title] !== false

            return (
              <div key={group.title} className={cn('mb-4', collapsed && 'mb-3')}>
                {collapsed ? (
                  <div className="mx-auto mb-2 h-px w-9 bg-white/10" />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="mb-2 flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]/70 transition-colors hover:text-[#D4AF37]"
                    aria-expanded={groupExpanded}
                  >
                    <span>{group.title}</span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-current/70 transition-transform duration-200',
                        groupExpanded && 'rotate-180'
                      )}
                    />
                  </button>
                )}

                <AnimatePresence initial={false}>
                  {groupExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={cn('space-y-1', !collapsed && 'relative ml-3 border-l border-[#D4AF37]/18 pl-3')}>
                        {group.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            title={collapsed ? item.label : undefined}
                            className={({ isActive }) => navClass(isActive, true)}
                          >
                            <item.icon className="h-[18px] w-[18px] shrink-0" />
                            {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
                          </NavLink>
                        ))}
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
            <div className="mb-3 flex items-center gap-3 rounded-[16px_3px_16px_3px] border border-white/10 bg-white/[0.05] p-3">
              <span className="grid h-9 w-9 place-items-center bg-white/10 text-[#D4AF37]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-[#FFF8DC]/45">Portal status</p>
                <p className="truncate text-sm font-bold">Member access active</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className={cn(
              'btn min-h-11 border-white/10 bg-white/[0.06] text-[#FFF8DC]/70 hover:border-white/20 hover:bg-white/[0.1] hover:text-[#FFF8DC]',
              collapsed ? 'btn-square mx-auto flex' : 'w-full justify-between px-4'
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
      </motion.aside>
    </>
  )
}
