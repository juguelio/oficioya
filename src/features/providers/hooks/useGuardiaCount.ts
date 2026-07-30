import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { CiudadId } from '@/design-system/tokens'

type GuardiaCount = Record<string, number>

export function useGuardiaCount(ciudadId: CiudadId | null): GuardiaCount {
  const [counts, setCounts] = useState<GuardiaCount>({})

  useEffect(() => {
    if (!ciudadId) {
      setCounts({})
      return
    }

    const id = ciudadId // narrowado post-guard para el closure async

    async function fetchCounts() {
      // Lee de la vista, no de la tabla base: anon no tiene SELECT sobre `providers`
      // (migración 20260730020000) para que el whatsapp de los prestadores en guardia
      // no se pueda sacar salteando el paywall de urgencias.
      const { data } = await supabase
        .from('providers_public')
        .select('rubro_id')
        .eq('ciudad_id', id)
        .eq('is_emergency_available', true)
        .eq('status', 'active')

      if (!data) return
      const c: GuardiaCount = {}
      for (const row of data) {
        c[row.rubro_id] = (c[row.rubro_id] ?? 0) + 1
      }
      setCounts(c)
    }

    fetchCounts()

    // ⚠️ Realtime opera sobre tablas, no sobre vistas, y desde la migración 20260730020000
    // anon no tiene SELECT sobre `providers` — los payloads de postgres_changes respetan
    // los privilegios del suscriptor, así que un visitante sin sesión NO recibe estos
    // eventos y el conteo queda en el valor del fetch inicial. Es el precio de cerrar la
    // fuga del whatsapp de guardia, y hoy no afecta a nadie porque este hook no está en
    // uso. Si se cablea a una pantalla pública y hace falta el conteo en vivo, la salida
    // es un RPC security-definer que devuelva sólo el agregado (nunca la fila).
    const channel = supabase
      .channel(`guardia-count:${ciudadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'providers', filter: `ciudad_id=eq.${ciudadId}` },
        () => { fetchCounts() },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ciudadId])

  return counts
}
