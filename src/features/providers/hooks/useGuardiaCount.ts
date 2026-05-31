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
      const { data } = await supabase
        .from('providers')
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
