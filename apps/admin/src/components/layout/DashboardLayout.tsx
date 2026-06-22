import { Outlet } from 'react-router-dom'
import { useUIStore } from '../../stores/ui.store'
import { useAuth } from '../../hooks/useAuth'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import HelpExperience from '../help/HelpExperience'
import { cn } from '../../utils/cn'

export default function DashboardLayout() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()
  const { currentUser } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-cream-50 text-brand-950 dark:bg-dark-bg dark:text-gray-100">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-brand-950/55 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        data-tour="sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 bg-brand-950',
          'transition-all duration-300 ease-in-out',
          'lg:relative lg:z-auto',
          sidebarCollapsed ? 'lg:w-[86px]' : 'lg:w-[286px]',
          mobileSidebarOpen ? 'translate-x-0 w-[286px]' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.055] dark:opacity-[0.035]"
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(0,27,80,.42) 1px, transparent 1px), linear-gradient(rgba(0,27,80,.42) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 bottom-10 h-[430px] w-[430px] object-contain opacity-[0.035] dark:opacity-[0.03]"
        />
        <Topbar />
        <main data-tour="main-content" className="relative z-10 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1540px] px-4 py-6 md:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
        <HelpExperience userKey={currentUser?.id ?? currentUser?.email} />
      </div>
    </div>
  )
}
