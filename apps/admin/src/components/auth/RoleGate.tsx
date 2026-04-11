import { type ReactNode } from 'react'
import { usePermission } from '../../hooks/usePermission'
import type { Permission } from '../../types'

interface RoleGateProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export default function RoleGate({ permission, children, fallback = null }: RoleGateProps) {
  const { can } = usePermission()
  return can(permission) ? <>{children}</> : <>{fallback}</>
}
