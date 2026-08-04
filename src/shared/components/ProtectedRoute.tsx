import { Navigate, useLocation } from 'react-router-dom'
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
  const location = useLocation()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-noche"
      >
        <div className="w-48 h-4 rounded-full animate-pulse bg-sombra" />
      </div>
    )
  }

  // En dev sin sesión se deja pasar: /dashboard muestra el selector de perfiles
  // mock (comodidad de desarrollo). En producción, sin sesión → login, siempre.
  if (!user && !import.meta.env.DEV) {
    // Se guarda a dónde querías ir para volver ahí después de entrar. Antes
    // todos los caminos terminaban en /dashboard: si tocabas un link a un
    // trabajo, entrabas y aparecías en otro lado.
    const destino = location.pathname + location.search + location.hash
    return <Navigate to={`/login?next=${encodeURIComponent(destino)}`} replace />
  }

  return <>{children}</>
}
