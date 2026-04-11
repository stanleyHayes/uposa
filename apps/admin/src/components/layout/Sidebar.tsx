import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Newspaper,
  FolderKanban,
  HandCoins,
  Wallet,
  UserCheck,
  Users,
  ShieldCheck,
  ShieldHalf,
  Settings,
  X,
  Megaphone,
  Briefcase,
  MessageSquare,
  BarChart3,
  Vote,
  Crown,
  BookOpen,
  Mail,
  Globe,
  Images,
  GraduationCap,
  Send,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { usePermission } from '../../hooks/usePermission'
import { useNotificationStore } from '../../stores/notification.store'
import type { Permission } from '../../types'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  permission?: Permission
  /** Notification types that count toward this nav item's badge */
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

  /** Count unread notifications matching given types */
  const getBadgeCount = (types?: string[]): number => {
    if (!types || types.length === 0) return 0
    return notifications.filter((n) => !n.isRead && types.includes(n.type)).length
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-dark-border',
        collapsed ? 'justify-center px-2 py-5' : 'justify-between px-4 py-5'
      )}>
        <div className={cn('flex items-center', collapsed ? 'gap-0' : 'gap-3')}>
          <img src="/logo.png" alt="UPOSA" className="w-9 h-9 rounded-xl shrink-0" />
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-sm leading-tight">UPOSA</p>
              <p className="text-gray-400 text-xs leading-tight">Admin Portal</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-hover"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        'flex-1 overflow-y-auto py-4 space-y-6',
        collapsed ? 'px-1.5' : 'px-3'
      )}>
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.permission || can(item.permission)
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {collapsed && (
                <div className="mb-1 border-b border-dark-border/50 mx-2" />
              )}
              <ul className={cn('space-y-0.5', !collapsed && 'stagger-fast')}>
                {visibleItems.map((item) => {
                  const badge = getBadgeCount(item.notifTypes)
                  return (
                    <li key={item.to} className={!collapsed ? 'nav-item-enter' : undefined}>
                      <NavLink
                        to={item.to}
                        onClick={onCloseMobile}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                            collapsed
                              ? 'justify-center px-2 py-2.5 relative'
                              : 'gap-3 px-3 py-2',
                            isActive
                              ? 'bg-brand-600 text-cream-100 shadow-sm'
                              : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                          )
                        }
                      >
                        <item.icon size={18} className="shrink-0" />
                        {!collapsed && <span className="flex-1">{item.label}</span>}
                        {/* Badge */}
                        {badge > 0 && (
                          collapsed ? (
                            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
                          ) : (
                            <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-dark-border">
          <p className="text-xs text-gray-600 text-center">UPOSA © {new Date().getFullYear()}</p>
        </div>
      )}
    </div>
  )
}
