import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-cyan-400 animate-spin" />
            </div>
        )
    }

    // Access requires admin or sub-admin privileges; ProtectedRoute handles the
    // unauthenticated case before this runs.
    const role = user?.role?.toLowerCase()
    if (!role || !['superadmin', 'super_admin', 'admin', 'subadmin', 'sub_admin'].includes(role)) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
