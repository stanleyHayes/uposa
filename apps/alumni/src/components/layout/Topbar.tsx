import { useState, useRef, useEffect } from 'react'
import { Menu, Sun, Moon, LogOut, User, Bell, Settings, PanelLeftClose, PanelLeftOpen, Search, Command } from 'lucide-react'
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

  return (
    <header className="sticky top-0 z-20 border-b border-base-300/80 bg-base-100/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          {/* Mobile menu toggle */}
          <button className="btn btn-ghost btn-sm btn-square lg:hidden" onClick={toggleSidebar}>
            <Menu className="w-5 h-5" />
          </button>
          {/* Desktop collapse toggle */}
          <button className="btn btn-ghost btn-sm btn-square hidden lg:flex" onClick={toggleSidebarCollapse} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          {/* Greeting */}
          <div className="hidden md:flex flex-col min-w-0 ml-1">
            <p className="text-[11px] text-base-content/40 font-medium truncate">
              {greeting}, {user?.fullName?.split(' ')[0]}
            </p>
            <h2 className="text-sm font-semibold text-base-content truncate -mt-0.5">
              Alumni Portal
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Search Pill */}
          <button
            className="hidden sm:flex items-center gap-2 h-9 pl-3 pr-2 rounded-xl bg-base-200/80 border border-base-300/60 text-base-content/40 hover:border-primary/30 hover:text-base-content/60 transition-all text-sm"
            title="Search"
          >
            <Search size={14} />
            <span className="text-xs">Search...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md bg-base-100 border border-base-300/60 text-[10px] font-medium text-base-content/30">
              <Command size={10} />K
            </kbd>
          </button>

          {/* Theme toggle */}
          <button
            className="btn btn-ghost btn-sm btn-square rounded-xl"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
          </button>

          {/* Notifications */}
          <button className="btn btn-ghost btn-sm btn-square rounded-xl relative">
            <Bell className="w-[18px] h-[18px]" />
          </button>

          {/* Separator */}
          <div className="hidden sm:block w-px h-7 bg-base-300/80 mx-1" />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all',
                menuOpen ? 'bg-base-200' : 'hover:bg-base-200'
              )}
            >
              <div className="relative">
                <Avatar src={user?.photoUrl} name={user?.fullName || 'User'} size="sm" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-base-100" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold text-base-content leading-tight max-w-[120px] truncate">
                  {user?.fullName}
                </span>
                <span className="text-[11px] text-base-content/40 leading-tight">
                  {user?.yearGroup ? `Class of ${user.yearGroup}` : 'Member'}
                </span>
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-base-100 rounded-2xl shadow-2xl border border-base-300 py-1.5 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-base-200">
                  <p className="text-sm font-bold text-base-content truncate">{user?.fullName}</p>
                  <p className="text-xs text-base-content/50 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-base-content/70 hover:bg-base-200 transition-colors"
                    onClick={() => { setMenuOpen(false); navigate('/profile') }}
                  >
                    <User size={16} className="text-base-content/40" />
                    My Profile
                  </button>
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-base-content/70 hover:bg-base-200 transition-colors"
                    onClick={() => { setMenuOpen(false); navigate('/settings') }}
                  >
                    <Settings size={16} className="text-base-content/40" />
                    Settings
                  </button>
                </div>
                <div className="border-t border-base-200 pt-1">
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout() }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
