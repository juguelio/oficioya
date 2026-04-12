import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Provider } from '@/features/providers/types'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { DbProvider } from '@/lib/database.types'

type Filters = {
  ciudad?: CiudadId
  rubro?: RubroId
  soloVerificados?: boolean
  soloConPlan?: boolean
}

type UseProvidersReturn = {
  providers: Provider[]
  total: number
  isEmpty: boolean
  loading: boolean
  error: string | null
}

const planOrder: Record<string, number> = {
  destacado:   0,
  profesional: 1,
  basico:      2,
}

function toProvider(row: DbProvider): Provider {
  return {
    id:           row.id,
    name:         row.name,
    rubro:        row.rubro_id as RubroId,
    ciudad:       row.ciudad_id as CiudadId,
    barrio:       row.barrio ?? undefined,
    phone:        row.phone,
    rating:       Number(row.rating),
    totalJobs:    row.total_jobs,
    isVerified:   row.is_verified,
    subscription: (row.subscription_tier_id ?? null) as Provider['subscription'],
    status:       row.status as Provider['status'],
    lat:          row.lat ?? undefined,
    lng:          row.lng ?? undefined,
    bio:          row.bio ?? undefined,
    photos:       row.photos,
    createdAt:    row.created_at.slice(0, 10),
  }
}

export function useProviders(filters: Filters = {}): UseProvidersReturn {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function run() {
      let query = supabase
        .from('providers')
        .select('*')
        .eq('status', 'active')

      if (filters.ciudad)          query = query.eq('ciudad_id', filters.ciudad)
      if (filters.rubro)           query = query.eq('rubro_id', filters.rubro)
      if (filters.soloVerificados) query = query.eq('is_verified', true)
      if (filters.soloConPlan)     query = query.not('subscription_tier_id', 'is', null)

      const { data, error: dbError } = await query

      if (cancelled) return

      if (dbError) {
        setError(dbError.message)
        setLoading(false)
        return
      }

      const sorted = (data as DbProvider[])
        .map(toProvider)
        .sort((a, b) => {
          // TODO: add is_emergency_available as first sort key when field lands on Provider
          const pa = planOrder[a.subscription ?? ''] ?? 3
          const pb = planOrder[b.subscription ?? ''] ?? 3
          if (pa !== pb) return pa - pb
          return b.rating - a.rating
        })

      setProviders(sorted)
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [filters.ciudad, filters.rubro, filters.soloVerificados, filters.soloConPlan])

  return {
    providers,
    total:   providers.length,
    isEmpty: !loading && providers.length === 0,
    loading,
    error,
  }
}
