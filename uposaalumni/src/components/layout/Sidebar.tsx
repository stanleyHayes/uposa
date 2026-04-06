import { NavLink } from 'react-router'
import {
  LayoutDashboard, User, Calendar, Newspaper, FolderOpen, Heart, CreditCard,
  Briefcase, Users, MessageSquare, BarChart3, Vote, Handshake, Mail, X,
  Settings, ChevronsLeft, ChevronsRight, FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useUIStore } from '../../stores/ui.store'
import { cn } from '../../utils/cn'
import { motion } from 'framer-motion'

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
      { to: '/events', label: 'Events', icon: Calendar },
      { to: '/news', label: 'News', icon: Newspaper },
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

  const collapsed = sidebarCollapsed

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <motion.aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full bg-base-200 border-r border-base-300 transition-all duration-300 lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto overflow-y-auto overflow-x-hidden flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          'w-64'
        )}
        layout
      >
        {/* Header */}
        <div className={cn('flex items-center border-b border-base-300 shrink-0', collapsed ? 'justify-center p-3' : 'justify-between p-4')}>
          <NavLink to="/dashboard" className="flex items-center gap-2 font-bold text-primary text-lg shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-content flex items-center justify-center shrink-0">
              <span className="text-sm font-black">U</span>
            </div>
            {!collapsed && <span className="whitespace-nowrap">UPOSA Alumni</span>}
          </NavLink>
          <button className="btn btn-ghost btn-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 py-3', collapsed ? 'px-2' : 'px-3')}>
          {navGroups.map((group) => (
            <div key={group.title} className="mb-3">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-base-content/40">
                  {group.title}
                </p>
              )}
              {collapsed && <div className="border-b border-base-300 mb-2 mx-1" />}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center rounded-lg text-sm font-medium transition-colors',
                        collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                        isActive
                          ? 'bg-primary text-primary-content'
                          : 'text-base-content/60 hover:bg-base-300 hover:text-base-content'
                      )
                    }
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle - desktop only */}
        <div className={cn('hidden lg:flex border-t border-base-300 shrink-0', collapsed ? 'justify-center p-2' : 'p-3')}>
          <button
            onClick={toggleSidebarCollapse}
            className={cn(
              'btn btn-ghost btn-sm text-base-content/50 hover:text-base-content',
              collapsed ? 'btn-square' : 'w-full justify-start gap-2'
            )}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <><ChevronsLeft className="w-4 h-4" /> Collapse</>}
          </button>
        </div>
      </motion.aside>
    </>
  )
}
