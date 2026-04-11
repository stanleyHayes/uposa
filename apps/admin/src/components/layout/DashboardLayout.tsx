import { Outlet } from 'react-router-dom'
import { useUIStore } from '../../stores/ui.store'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { cn } from '../../utils/cn'

export default function DashboardLayout() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-bg">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on desktop (full or collapsed), drawer on mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-dark-bg flex flex-col flex-shrink-0',
          'transition-all duration-300 ease-in-out',
          'lg:relative lg:z-auto',
          // Desktop: always visible, toggle between full and icon-only
          sidebarCollapsed ? 'lg:w-[4.5rem]' : 'lg:w-64',
          // Mobile: slide in/out as overlay, always full width when open
          mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
