import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

type ProtectedRouteProps = {
  children: React.ReactNode
}

// Guard único de rutas privadas. Regla de oro: NUNCA redirigir por `!user` sin
// esperar a que `loading` sea false — leer la sesión es asincrónico y en el
// primer render `user` es null aunque el usuario esté logueado. Ese patrón
// causó dos de los bugs de "entrás y te devuelve al login".
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

  // En dev sin sesión se deja pasar: /dashboard muestra el selector de perfiles
  // mock (comodidad de desarrollo). En producción, sin sesión → login, siempre.
  if (!user && !import.meta.env.DEV) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
