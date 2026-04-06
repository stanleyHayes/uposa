import { Outlet } from 'react-router'
import { useTheme } from '../../hooks/useTheme'
import { Sun, Moon } from 'lucide-react'
import ToastContainer from '../ui/ToastContainer'

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen flex bg-base-100">
      {/* The side panel is rendered inside each page for contextual content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar - mobile only or over form side */}
        <div className="absolute top-4 right-4 z-20">
          <button
            className="btn btn-ghost btn-sm btn-circle bg-base-200/50 backdrop-blur"
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
        <Outlet />
      </div>
      <ToastContainer />
    </div>
  )
}
