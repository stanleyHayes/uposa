import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import {
  LayoutDashboard, User, Calendar, Newspaper, FolderOpen, Heart, CreditCard,
  Briefcase, Users, MessageSquare, BarChart3, Vote, Handshake, Mail, X,
  Settings, ChevronsLeft, ChevronsRight, FileText, ChevronDown, Layers,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useUIStore } from '../../stores/ui.store'
import { cn } from '../../utils/cn'
import { motion, AnimatePresence } from 'framer-motion'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: (NavItem | NavItemWithChildren)[]
}

interface NavItemWithChildren {
  label: string
  icon: LucideIcon
  children: NavItem[]
}

function isNavItemWithChildren(item: NavItem | NavItemWithChildren): item is NavItemWithChildren {
  return 'children' in item
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
      {
        label: 'Updates',
        icon: Layers,
        children: [
          { to: '/news', label: 'News', icon: Newspaper },
          { to: '/events', label: 'Events', icon: Calendar },
          { to: '/projects', label: 'Projects', icon: FolderOpen },
        ],
      },
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
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  const collapsed = sidebarCollapsed

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isChildActive = (children: NavItem[]) => children.some((c) => location.pathname.startsWith(c.to))

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
            <img src="/logo.png" alt="UPOSA" className="w-9 h-9 rounded-xl shrink-0" />
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
                {group.items.map((item) =>
                  isNavItemWithChildren(item) ? (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center rounded-lg text-sm font-medium transition-colors w-full',
                          collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                          isChildActive(item.children)
                            ? 'bg-primary/10 text-primary'
                            : 'text-base-content/60 hover:bg-base-300 hover:text-base-content'
                        )}
                      >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown
                              className={cn(
                                'w-4 h-4 transition-transform duration-200',
                                (expandedMenus[item.label] || isChildActive(item.children)) && 'rotate-180'
                              )}
                            />
                          </>
                        )}
                      </button>
                      {!collapsed && (
                        <AnimatePresence initial={false}>
                          {(expandedMenus[item.label] || isChildActive(item.children)) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 pl-3 border-l border-base-300 mt-0.5 space-y-0.5">
                                {item.children.map((child) => (
                                  <NavLink
                                    key={child.to}
                                    to={child.to}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) =>
                                      cn(
                                        'flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                          ? 'bg-primary text-[#FFF8DC]'
                                          : 'text-base-content/60 hover:bg-base-300 hover:text-base-content'
                                      )
                                    }
                                  >
                                    <child.icon className="w-4 h-4 shrink-0" />
                                    <span>{child.label}</span>
                                  </NavLink>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  ) : (
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
                            ? 'bg-primary text-[#FFF8DC]'
                            : 'text-base-content/60 hover:bg-base-300 hover:text-base-content'
                        )
                      }
                    >
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  )
                )}
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
