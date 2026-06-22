import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, LogOut, User, Moon, Sun, Check, CheckCheck, Search, Command, Sparkles, PanelLeftClose, PanelLeftOpen, BookOpen, HelpCircle, Map } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../stores/ui.store'
import { useNotificationStore } from '../../stores/notification.store'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../constants/roles'
import { cn } from '../../utils/cn'
import { formatTimeAgo } from '../../utils/formatters'
import { animateThemeToggle } from '../../utils/themeTransition'
import { openAdminPageHelp, replayAdminTour } from '../help/helpEvents'

const NOTIFICATION_ICONS: Record<string, string> = {
  NEW_REGISTRATION: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300',
  NEW_CONTACT_MESSAGE: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  NEW_DONATION: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
  NEW_TRANSCRIPT_REQUEST: 'bg-cream-100 text-brand-950 dark:bg-cream-300/15 dark:text-cream-200',
  PENDING_JOB: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  NEW_FORUM_POST: 'bg-brand-100 text-brand-500 dark:bg-brand-900/30 dark:text-brand-400',
  NEW_MENTORSHIP_REQUEST: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300',
  GENERAL: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default function Topbar() {
  const { toggleSidebar, sidebarCollapsed, darkMode, toggleDarkMode } = useUIStore()
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } = useNotificationStore()
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications, fetchUnreadCount])

  const handleNotifClick = (notif: typeof notifications[0]) => {
    if (!notif.isRead) markAsRead(notif.id)
    if (notif.link) {
      navigate(notif.link)
      setNotifOpen(false)
    }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <header data-tour="topbar" className="sticky top-0 z-30 border-b border-brand-950/10 bg-cream-50/90 shadow-[0_1px_0_rgba(0,27,80,0.03)] backdrop-blur-xl dark:border-dark-border dark:bg-dark-card/85">
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cream-500/70 to-transparent" />
      <div className="flex h-[72px] items-center gap-3 px-4 lg:px-6">
        <button
          onClick={toggleSidebar}
          className="grid h-11 w-11 place-items-center border border-brand-950/10 bg-cream-100/70 text-brand-950 transition-colors hover:border-brand-950/20 hover:bg-cream-100 dark:border-white/10 dark:bg-dark-hover dark:text-cream-100 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <button
          onClick={toggleSidebar}
          className="hidden h-11 w-11 place-items-center border border-brand-950/10 bg-cream-100/55 text-brand-950 transition-colors hover:border-brand-950/20 hover:bg-cream-100 dark:border-white/10 dark:bg-dark-hover dark:text-cream-100 lg:grid"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="hidden min-w-0 flex-col md:flex">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-brand-950/42 dark:text-cream-100/42">
            {greeting}, {currentUser?.name?.split(' ')[0]}
          </p>
          <div className="flex items-center gap-2">
            <h2 className="-mt-0.5 truncate text-base font-bold text-brand-950 dark:text-gray-100">Admin workspace</h2>
            <span className="hidden items-center gap-1 border border-cream-500/35 bg-cream-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-950 sm:inline-flex dark:text-cream-100">
              <Sparkles className="h-3 w-3" />
              Live desk
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <button
          data-tour="search"
          className="hidden min-w-[260px] max-w-md flex-1 items-center justify-between gap-4 border border-brand-950/10 bg-cream-100/45 px-4 py-2.5 text-sm text-brand-950/45 transition-all hover:border-brand-950/20 hover:bg-cream-100/70 hover:text-brand-950/65 dark:border-white/10 dark:bg-dark-hover dark:text-cream-100/45 dark:hover:text-cream-100/70 lg:flex"
          title="Search"
        >
          <span className="flex items-center gap-2">
            <Search size={16} />
            Search the console
          </span>
          <kbd className="inline-flex h-6 items-center gap-1 border border-brand-950/10 bg-cream-50 px-2 text-[10px] font-bold text-brand-950/35 dark:border-white/10 dark:bg-dark-card dark:text-cream-100/35">
            <Command size={12} />K
          </kbd>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => animateThemeToggle(toggleDarkMode, e)}
            className="grid h-10 w-10 place-items-center border border-brand-950/10 bg-cream-100/55 text-brand-950/65 transition-colors hover:border-brand-950/20 hover:bg-cream-100 hover:text-brand-950 dark:border-white/10 dark:bg-dark-hover dark:text-cream-100/65 dark:hover:text-cream-100"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              data-tour="notifications"
              onClick={() => { setNotifOpen((v) => !v); if (!notifOpen) fetchNotifications() }}
              className="relative grid h-10 w-10 place-items-center border border-brand-950/10 bg-cream-100/55 text-brand-950/65 transition-colors hover:border-brand-950/20 hover:bg-cream-100 hover:text-brand-950 dark:border-white/10 dark:bg-dark-hover dark:text-cream-100/65 dark:hover:text-cream-100"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-cream-50 dark:ring-dark-card">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 flex max-h-[70vh] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden border border-brand-950/10 bg-cream-50 shadow-[0_24px_70px_rgba(0,27,80,0.18)] dark:border-dark-border dark:bg-dark-card dark:shadow-black/30">
                <div className="h-1 bg-gradient-to-r from-cream-500 via-brand-950 to-cream-500" />
                <div className="flex items-center justify-between border-b border-brand-950/10 px-5 py-3.5 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-brand-950 dark:text-gray-100">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-cream-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-950 dark:text-cream-100">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-950 dark:text-cream-300 dark:hover:text-cream-100"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center bg-cream-100 dark:bg-dark-hover">
                        <Sparkles size={22} className="text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-sm font-bold text-brand-950/60 dark:text-gray-400">All caught up!</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">New activity will appear here</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={cn(
                          'w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors border-b border-gray-50 dark:border-dark-border/50',
                          !notif.isRead && 'bg-cream-100/70 dark:bg-brand-950/15'
                        )}
                      >
                        <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center', NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.GENERAL)}>
                          <Bell size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm font-medium truncate', notif.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100')}>
                              {notif.title}
                            </p>
                            {!notif.isRead && <span className="h-2 w-2 shrink-0 bg-cream-500" />}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{notif.message}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id) }}
                            className="mt-1 shrink-0 p-1 hover:bg-cream-100 dark:hover:bg-dark-hover"
                            title="Mark as read"
                          >
                            <Check size={12} className="text-gray-400" />
                          </button>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mx-1 hidden h-8 w-px bg-brand-950/10 dark:bg-dark-border sm:block" />

        <div className="relative" ref={dropdownRef}>
          <button
            data-tour="user-menu"
            onClick={() => setDropdownOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2.5 border border-transparent px-2 py-1.5 transition-all',
              dropdownOpen
                ? 'border-brand-950/10 bg-cream-100/80 dark:border-white/10 dark:bg-dark-hover'
                : 'hover:border-brand-950/10 hover:bg-cream-100/65 dark:hover:border-white/10 dark:hover:bg-dark-hover'
            )}
          >
            <div className="relative">
              <img
                src={
                  currentUser?.avatarUrl ??
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name ?? 'User')}&background=001B50&color=FFF8DC&bold=true&size=64`
                }
                alt={currentUser?.name}
                className="h-8 w-8 object-cover ring-2 ring-cream-100 dark:ring-dark-border"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 ring-2 ring-cream-50 dark:ring-dark-card" />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-bold leading-tight text-brand-950 dark:text-gray-100">
                {currentUser?.name}
              </span>
              <span className="text-[11px] leading-tight text-brand-950/42 dark:text-gray-500">
                {currentUser ? ROLES[currentUser.role] : ''}
              </span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden border border-brand-950/10 bg-cream-50 py-1.5 shadow-[0_24px_70px_rgba(0,27,80,0.18)] dark:border-dark-border dark:bg-dark-card dark:shadow-black/30">
              <div className="h-1 bg-gradient-to-r from-cream-500 via-brand-950 to-cream-500" />
              <div className="border-b border-brand-950/10 px-4 py-3 dark:border-dark-border">
                <p className="truncate text-sm font-bold text-brand-950 dark:text-gray-100">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
              </div>
              <div className="py-1">
                <button
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cream-100 dark:hover:bg-dark-hover"
                  onClick={() => { setDropdownOpen(false); navigate('/settings') }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-brand-950/10 bg-cream-100 text-brand-950/60 dark:border-white/10 dark:bg-dark-hover dark:text-cream-100/60">
                    <User size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brand-950 dark:text-gray-100">Profile & Settings</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-brand-950/48 dark:text-gray-400">Manage profile, preferences, and account safety.</span>
                  </span>
                </button>
                <button
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cream-100 dark:hover:bg-dark-hover"
                  onClick={() => { setDropdownOpen(false); openAdminPageHelp() }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-brand-950/10 bg-cream-100 text-brand-950/60 dark:border-white/10 dark:bg-dark-hover dark:text-cream-100/60">
                    <HelpCircle size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brand-950 dark:text-gray-100">Page Help</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-brand-950/48 dark:text-gray-400">Explain the current admin screen.</span>
                  </span>
                </button>
                <button
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cream-100 dark:hover:bg-dark-hover"
                  onClick={() => { setDropdownOpen(false); replayAdminTour() }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-brand-950/10 bg-cream-100 text-brand-950/60 dark:border-white/10 dark:bg-dark-hover dark:text-cream-100/60">
                    <Map size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brand-950 dark:text-gray-100">Replay Tour</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-brand-950/48 dark:text-gray-400">Restart the dashboard walkthrough.</span>
                  </span>
                </button>
                <button
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cream-100 dark:hover:bg-dark-hover"
                  onClick={() => { setDropdownOpen(false); navigate('/help') }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-brand-950/10 bg-cream-100 text-brand-950/60 dark:border-white/10 dark:bg-dark-hover dark:text-cream-100/60">
                    <BookOpen size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brand-950 dark:text-gray-100">Help Library</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-brand-950/48 dark:text-gray-400">Browse every admin page guide.</span>
                  </span>
                </button>
              </div>
              <div className="border-t border-brand-950/10 pt-1 dark:border-dark-border">
                <button
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => { setDropdownOpen(false); logout() }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-red-200 bg-red-50 text-red-600 dark:border-red-900/40 dark:bg-red-900/20">
                    <LogOut size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-red-600">Sign Out</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-red-500/75 dark:text-red-300/70">End this admin session.</span>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
