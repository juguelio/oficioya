import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { takePostLoginNext } from '@/lib/auth-redirect'

// Supabase devuelve los errores de los links de email en el FRAGMENTO de la URL
// (#error=access_denied&error_code=otp_expired...), sobre la Site URL. La app los
// ignoraba: el usuario tocaba un link vencido, caía en la home como si nada y
// concluía que "el login está roto" — pasó de verdad, con un link viejo que
// Gmail agrupa en el mismo hilo que el nuevo.
export function RootLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, loading } = useAuth()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('error')) return
    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const code = params.get('error_code') ?? params.get('error') ?? 'desconocido'
    // Se limpia el hash para que el error no reaparezca al navegar.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    navigate(`/login?authError=${encodeURIComponent(code)}`, { replace: true })
  }, [navigate])

  // Vuelta de Google. OAuth siempre regresa a /dashboard (una sola URL de retorno
  // que habilitar en Supabase); el destino que el usuario pidió — la ruta privada
  // que `ProtectedRoute` guardó, o /mis-trabajos en el alta de cliente — quedó
  // guardado del lado del cliente y se aplica acá, ya con la sesión resuelta.
  useEffect(() => {
    if (loading || !user || pathname !== '/dashboard') return
    const next = takePostLoginNext()
    if (next && next !== pathname) navigate(next, { replace: true })
  }, [loading, user, pathname, navigate])

  return <Outlet />
}
