import { Navigate } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import type { AppModule, PermissionAction } from '@/types'
import type { ReactNode } from 'react'

interface Props {
  module: AppModule
  action?: PermissionAction
  children: ReactNode
  fallback?: ReactNode
}

export function RequirePermission({ module, action = 'view', children, fallback }: Props) {
  const { can, loading } = usePermissions()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!can(module, action)) {
    if (fallback) return <>{fallback}</>
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
