import { Outlet, useLocation } from 'react-router-dom'
import type { AccessRequirement } from '../shared/auth/access'
import { useAuth } from '../features/auth/AuthProvider'
import { AccessDeniedPage } from '../shared/components/AccessDeniedPage'

interface RouteAccessBoundaryProps { access?: AccessRequirement }

/** Route-level UX boundary. The backend must enforce the same authorization. */
export function RouteAccessBoundary({ access }: RouteAccessBoundaryProps) {
  const { can } = useAuth()
  const location = useLocation()
  if (!can(access)) return <AccessDeniedPage returnTo={location.pathname} />
  return <Outlet />
}
