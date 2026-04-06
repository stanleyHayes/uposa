import { Menu, Sun, Moon, LogOut, User, Bell, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useNavigate, Link } from 'react-router'
import { useAuthStore } from '../../stores/auth.store'
import { useUIStore } from '../../stores/ui.store'
import { useTheme } from '../../hooks/useTheme'
import Avatar from '../ui/Avatar'

export default function Topbar() {
  const { user, logout } = useAuthStore()
  const { toggleSidebar, sidebarCollapsed, toggleSidebarCollapse } = useUIStore()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 bg-base-100/80 backdrop-blur border-b border-base-300">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-sm btn-square lg:hidden" onClick={toggleSidebar}>
            <Menu className="w-5 h-5" />
          </button>
          <button className="btn btn-ghost btn-sm btn-square hidden lg:flex" onClick={toggleSidebarCollapse} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-sm btn-square" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
          </button>

          <button className="btn btn-ghost btn-sm btn-square">
            <Bell className="w-[18px] h-[18px]" />
          </button>

          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-2 ml-1">
              <Avatar src={user?.photoUrl} name={user?.fullName || 'User'} size="sm" />
              <span className="hidden sm:inline text-sm max-w-[120px] truncate">{user?.fullName}</span>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300">
              <li>
                <Link to="/profile"><User className="w-4 h-4" /> My Profile</Link>
              </li>
              <li>
                <Link to="/settings"><Settings className="w-4 h-4" /> Settings</Link>
              </li>
              <li className="border-t border-base-200 mt-1 pt-1">
                <button onClick={handleLogout} className="text-error">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}
