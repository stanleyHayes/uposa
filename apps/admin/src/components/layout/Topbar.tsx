import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, LogOut, User, Moon, Sun, Check, CheckCheck, Search, Command, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../stores/ui.store'
import { useNotificationStore } from '../../stores/notification.store'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../constants/roles'
import { cn } from '../../utils/cn'
import { formatTimeAgo } from '../../utils/formatters'

const NOTIFICATION_ICONS: Record<string, string> = {
  NEW_REGISTRATION: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300',
  NEW_CONTACT_MESSAGE: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  NEW_DONATION: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
  NEW_TRANSCRIPT_REQUEST: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  PENDING_JOB: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  NEW_FORUM_POST: 'bg-brand-100 text-brand-500 dark:bg-brand-900/30 dark:text-brand-400',
  NEW_MENTORSHIP_REQUEST: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300',
  GENERAL: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default function Topbar() {
  const { toggleSidebar, darkMode, toggleDarkMode } = useUIStore()
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
    <header className="sticky top-0 z-30 border-b border-gray-200/80 dark:border-dark-border bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        {/* Mobile menu */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden rounded-xl p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Greeting + breadcrumb area */}
        <div className="hidden md:flex flex-col min-w-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate">
            {greeting}, {currentUser?.name?.split(' ')[0]}
          </p>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate -mt-0.5">
            Admin Dashboard
          </h2>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Quick Search Pill */}
        <button
          className="hidden sm:flex items-center gap-2 h-9 pl-3 pr-2 rounded-xl bg-gray-100/80 dark:bg-dark-hover border border-gray-200/60 dark:border-dark-border text-gray-400 dark:text-gray-500 hover:border-brand-300 dark:hover:border-brand-700 hover:text-gray-600 dark:hover:text-gray-300 transition-all text-sm"
          title="Search"
        >
          <Search size={14} />
          <span className="text-xs">Search...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-[10px] font-medium text-gray-400 dark:text-gray-500">
            <Command size={10} />K
          </kbd>
        </button>

        {/* Action buttons cluster */}
        <div className="flex items-center gap-1">
          {/* Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="relative rounded-xl p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover transition-all group"
            aria-label="Toggle dark mode"
          >
            <div className="relative">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <div className="absolute inset-0 rounded-full bg-amber-400/0 group-hover:bg-amber-400/10 dark:group-hover:bg-amber-400/10 transition-colors" />
            </div>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen((v) => !v); if (!notifOpen) fetchNotifications() }}
              className="relative rounded-xl p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover transition-all"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-bold px-1 ring-2 ring-white dark:ring-dark-card shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-white dark:bg-dark-card rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-200 dark:border-dark-border z-50 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-dark-hover flex items-center justify-center mb-3">
                        <Sparkles size={22} className="text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">All caught up!</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">New activity will appear here</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={cn(
                          'w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors border-b border-gray-50 dark:border-dark-border/50',
                          !notif.isRead && 'bg-brand-50/40 dark:bg-brand-950/15'
                        )}
                      >
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.GENERAL)}>
                          <Bell size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm font-medium truncate', notif.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100')}>
                              {notif.title}
                            </p>
                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{notif.message}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id) }}
                            className="shrink-0 mt-1 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-hover"
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

        {/* Separator */}
        <div className="hidden sm:block w-px h-7 bg-gray-200 dark:bg-dark-border mx-1" />

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all',
              dropdownOpen
                ? 'bg-gray-100 dark:bg-dark-hover'
                : 'hover:bg-gray-100 dark:hover:bg-dark-hover'
            )}
          >
            <div className="relative">
              <img
                src={
                  currentUser?.avatarUrl ??
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name ?? 'User')}&background=001B50&color=FFF8DC&bold=true&size=64`
                }
                alt={currentUser?.name}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-gray-100 dark:ring-dark-border"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-dark-card" />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                {currentUser?.name}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
                {currentUser ? ROLES[currentUser.role] : ''}
              </span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-card rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-200 dark:border-dark-border py-1.5 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
              </div>
              <div className="py-1">
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                  onClick={() => { setDropdownOpen(false); navigate('/settings') }}
                >
                  <User size={16} className="text-gray-400" />
                  Profile & Settings
                </button>
              </div>
              <div className="border-t border-gray-100 dark:border-dark-border pt-1">
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  onClick={() => { setDropdownOpen(false); logout() }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
