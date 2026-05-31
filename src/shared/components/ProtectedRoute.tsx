import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-noche)' }}
      >
        <div className="w-48 h-4 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-sombra)' }} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
