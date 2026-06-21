import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Command,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../stores/auth.store'
import { useUIStore } from '../../stores/ui.store'
import { useTheme } from '../../hooks/useTheme'
import Avatar from '../ui/Avatar'
import { cn } from '../../utils/cn'

export default function Topbar() {
  const { user, logout } = useAuthStore()
  const { toggleSidebar, sidebarCollapsed, toggleSidebarCollapse } = useUIStore()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const firstName = user?.fullName?.split(' ')[0] || 'Member'

  return (
    <header className="sticky top-0 z-20 border-b border-primary/10 bg-base-100/90 shadow-[0_1px_0_rgba(0,27,80,0.03)] backdrop-blur-xl">
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-secondary/45 to-transparent" />
      <div className="flex h-[72px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="btn btn-sm btn-square border-primary/10 bg-base-200/70 text-primary hover:border-primary/20 hover:bg-base-200 lg:hidden"
            onClick={toggleSidebar}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="hidden h-11 w-11 place-items-center border border-primary/10 bg-base-200/55 text-primary transition-colors hover:border-primary/20 hover:bg-base-200 lg:grid rounded-[14px_3px_14px_3px]"
            onClick={toggleSidebarCollapse}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          </button>

          <div className="min-w-0">
            <div className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-base-content/42 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              {greeting}, {firstName}
            </div>
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-bold leading-tight text-base-content md:text-lg">Alumni workspace</h1>
              <span className="hidden items-center gap-1 border border-secondary/25 bg-secondary/12 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary sm:inline-flex">
                <Sparkles className="h-3 w-3" />
                Live desk
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="hidden min-w-[260px] max-w-md flex-1 items-center justify-between gap-4 border border-primary/10 bg-base-200/45 px-4 py-2.5 text-sm text-base-content/45 transition-all hover:border-primary/20 hover:bg-base-200/70 hover:text-base-content/65 lg:flex rounded-[18px_3px_18px_3px]"
          title="Search"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search the portal
          </span>
          <kbd className="inline-flex h-6 items-center gap-1 border border-primary/10 bg-base-100 px-2 text-[10px] font-bold text-base-content/35">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center border border-primary/10 bg-base-200/55 text-base-content/65 transition-colors hover:border-primary/20 hover:bg-base-200 hover:text-primary rounded-[14px_3px_14px_3px]"
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>

          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center border border-primary/10 bg-base-200/55 text-base-content/65 transition-colors hover:border-primary/20 hover:bg-base-200 hover:text-primary rounded-[14px_3px_14px_3px]"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-secondary ring-2 ring-base-100" />
          </button>

          <div className="hidden h-8 w-px bg-primary/10 sm:block" />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                'flex min-h-11 items-center gap-2.5 border border-transparent px-2 py-1.5 transition-all rounded-[18px_3px_18px_3px]',
                menuOpen ? 'border-primary/10 bg-base-200/80' : 'hover:border-primary/10 hover:bg-base-200/65'
              )}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="relative">
                <Avatar src={user?.photoUrl} name={user?.fullName || 'User'} size="sm" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-base-100" />
              </div>
              <div className="hidden flex-col items-start sm:flex">
                <span className="max-w-[130px] truncate text-sm font-bold leading-tight text-base-content">
                  {user?.fullName || 'UPOSA Member'}
                </span>
                <span className="text-[11px] leading-tight text-base-content/42">
                  {user?.yearGroup ? `Class of ${user.yearGroup}` : 'Verified member'}
                </span>
              </div>
              <ChevronDown className={cn('hidden h-4 w-4 text-base-content/35 transition-transform sm:block', menuOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute right-0 top-full z-50 mt-3 w-[min(19rem,calc(100vw-2rem))] overflow-hidden border border-primary/10 bg-base-100 shadow-[0_24px_70px_rgba(0,27,80,0.18)] rounded-[20px_4px_20px_4px]"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                >
                  <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
                  <div className="border-b border-base-300/60 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={user?.photoUrl} name={user?.fullName || 'User'} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-base-content">{user?.fullName || 'UPOSA Member'}</p>
                        <p className="mt-0.5 truncate text-xs text-base-content/50">{user?.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-2 border border-success/15 bg-success/10 px-2.5 py-1.5 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active portal session
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-base-content/70 transition-colors hover:bg-base-200 hover:text-primary rounded-[14px_3px_14px_3px]"
                      onClick={() => { setMenuOpen(false); navigate('/profile') }}
                    >
                      <User className="h-4 w-4 text-base-content/40" />
                      My Profile
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-base-content/70 transition-colors hover:bg-base-200 hover:text-primary rounded-[14px_3px_14px_3px]"
                      onClick={() => { setMenuOpen(false); navigate('/settings') }}
                    >
                      <Settings className="h-4 w-4 text-base-content/40" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-base-300/60 p-2">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); handleLogout() }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-error transition-colors hover:bg-error/10 rounded-[14px_3px_14px_3px]"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
