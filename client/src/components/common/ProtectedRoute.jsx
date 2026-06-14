import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getHomeRoute } from '../../utils/routing'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated } = useAuth()

  if (isAuthenticated && user) {
    return <Navigate to={getHomeRoute(user.role)} replace />
  }

  return children
}

export function RoleHomeRedirect() {
  const { user, isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated && user ? getHomeRoute(user.role) : '/login'} replace />
}
