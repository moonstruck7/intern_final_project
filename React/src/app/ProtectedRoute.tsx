import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { LoadingState } from '../shared/components/AsyncStates'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState label="Restoring your session…" />
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}
