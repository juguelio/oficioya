import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type SubStatus = { tier_id: string; status: string; current_period_end: string | null }

// Estado y acciones de la suscripción del prestador logueado. El cobro real está gobernado por
// el flag VITE_SUBSCRIPTIONS_ENABLED: con el flag apagado el módulo queda dormido (lanzamiento
// gratis) y /planes no invoca el checkout.
export function useSubscription() {
  const enabled = import.meta.env.VITE_SUBSCRIPTIONS_ENABLED === 'true'
  const [status, setStatus] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc('get_my_subscription')
    setStatus((data?.[0] as SubStatus) ?? null)
  }, [])

  useEffect(() => {
    if (enabled) refresh()
  }, [enabled, refresh])

  const subscribe = useCallback(async (tierId: string) => {
    // El prestador se deriva del JWT en la edge function; acá solo chequeamos que haya sesión.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('no_session')
    setLoading(true)
    const { data, error } = await supabase.functions.invoke('subscription-checkout', {
      body: { tierId },
    })
    setLoading(false)
    if (error || !data?.init_point) throw new Error('checkout_failed')
    window.location.href = data.init_point as string
  }, [])

  const cancel = useCallback(async () => {
    setLoading(true)
    const { error } = await supabase.functions.invoke('subscription-cancel', { body: {} })
    setLoading(false)
    if (error) throw new Error('cancel_failed')
    await refresh()
  }, [refresh])

  return { enabled, status, loading, subscribe, cancel, refresh }
}
