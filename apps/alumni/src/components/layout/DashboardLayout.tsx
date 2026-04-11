import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ToastContainer from '../ui/ToastContainer'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-base-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
