import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// Quién está mirando la app. Hasta ahora toda cuenta se asumía prestador: el
// header decía "Mi panel" y /dashboard empujaba al onboarding de alta. Un cliente
// que se registraba para publicar trabajos terminaba en el chat de alta de
// prestador, sin salida.
//
// - 'prestador'             → tiene fila en providers
// - 'prestador-sin-perfil'  → se registró como prestador pero le falta completar el alta
// - 'cliente'               → cuenta de cliente (account_type en la metadata)
// - 'sin-definir'           → hay sesión pero no sabemos qué vino a hacer (típico Google)
export type ViewerRole =
  | 'prestador'
  | 'prestador-sin-perfil'
  | 'cliente'
  | 'sin-definir'
  | null

type ViewerState = {
  role:    ViewerRole
  loading: boolean
}

export function useViewer(): ViewerState & { isProvider: boolean } {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<ViewerState>({ role: null, loading: true })

  useEffect(() => {
    if (authLoading) { setState({ role: null, loading: true }); return }
    if (!user)       { setState({ role: null, loading: false }); return }

    let cancelled = false
    setState({ role: null, loading: true })

    supabase
      .from('providers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const declarado = (user.user_metadata as { account_type?: string } | undefined)?.account_type
        const role: ViewerRole = data
          ? 'prestador'
          : declarado === 'cliente'
            ? 'cliente'
          : declarado === 'prestador'
            ? 'prestador-sin-perfil'
            : 'sin-definir'
        setState({ role, loading: false })
      })

    return () => { cancelled = true }
  }, [user, authLoading])

  return { ...state, isProvider: state.role === 'prestador' }
}
