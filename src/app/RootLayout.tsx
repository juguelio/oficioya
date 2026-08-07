import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

// Supabase devuelve los errores de los links de email en el FRAGMENTO de la URL
// (#error=access_denied&error_code=otp_expired...), sobre la Site URL. La app los
// ignoraba: el usuario tocaba un link vencido, caía en la home como si nada y
// concluía que "el login está roto" — pasó de verdad, con un link viejo que
// Gmail agrupa en el mismo hilo que el nuevo.
export function RootLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('error')) return
    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const code = params.get('error_code') ?? params.get('error') ?? 'desconocido'
    // Se limpia el hash para que el error no reaparezca al navegar.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    navigate(`/login?authError=${encodeURIComponent(code)}`, { replace: true })
  }, [navigate])

  return <Outlet />
}
