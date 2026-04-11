import { type ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import type { Permission } from '../../types'

interface ProtectedRouteProps {
  requiredPermission?: Permission
  children?: ReactNode
}

export default function ProtectedRoute({ requiredPermission, children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth()
  const { can } = usePermission()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredPermission && !can(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 rounded-full bg-red-50 p-5 text-red-400">
          <ShieldOff size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          You don't have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
      </div>
    )
  }

  return children ? <>{children}</> : <Outlet />
}
