import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { sessionManager } from '../services/sessionManager'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !sessionManager.hasAccessToken() || sessionManager.isSessionExpired()) {
    const path = window.location.pathname || '/'
    const isAdmin = path.startsWith('/admin') || path.startsWith('/subadmin')
    return <Navigate to={isAdmin ? '/admin/signin' : '/signin'} replace />
  }

  return <>{children}</>
}
