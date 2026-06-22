import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ToastContainer from '../ui/ToastContainer'
import HelpExperience from '../help/HelpExperience'
import { useAuthStore } from '../../stores/auth.store'

export default function DashboardLayout() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex h-screen bg-base-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main data-tour="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <HelpExperience userKey={user?.id ?? user?.email} />
      <ToastContainer />
    </div>
  )
}
