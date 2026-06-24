import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Provider } from '@/features/providers/types'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { DbProviderPublic } from '@/lib/database.types'

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

export function toProvider(row: DbProviderPublic): Provider {
  return {
    id:           row.id,
    name:         row.name,
    rubro:        row.rubro_id as RubroId,
    ciudad:       row.ciudad_id as CiudadId,
    barrio:       row.barrio ?? undefined,
    phone:        row.whatsapp_number ?? '',   // contacto; '' si unclaimed (oculto hasta el claim)
    rating:       Number(row.rating),
    totalJobs:    row.total_jobs,
    isVerified:   row.is_verified,
    subscription: (row.subscription_tier_id ?? null) as Provider['subscription'],
    status:       row.status as Provider['status'],
    lat:          row.lat ?? undefined,
    lng:          row.lng ?? undefined,
    bio:          row.bio ?? undefined,
    photos:                row.photos,
    createdAt:             row.created_at.slice(0, 10),
    isEmergencyAvailable:  row.is_emergency_available,
    claimed:               row.claimed,
    externalRating:        row.external_rating ?? undefined,
    externalReviews:       row.external_reviews ?? undefined,
    sourceCount:           row.source_count ?? undefined,
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
      // providers_public = active + unclaimed (la vista filtra status y enmascara el whatsapp
      // de los unclaimed). No filtramos por status acá: los unclaimed se muestran (sin contacto).
      let query = supabase
        .from('providers_public')
        .select('*')

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

      const sorted = (data as DbProviderPublic[])
        .map(toProvider)
        .sort((a, b) => {
          // 1. 🔴 en guardia (modo guardia) siempre primero
          if (a.isEmergencyAvailable !== b.isEmergencyAvailable) {
            return a.isEmergencyAvailable ? -1 : 1
          }
          // 2. ✓ reclamados (miembros reales) por encima de los sin reclamar
          if (a.claimed !== b.claimed) return a.claimed ? -1 : 1
          if (a.claimed) {
            // reclamados: por plan (destacado→profesional→basico→sin plan), luego rating de Oficio
            const pa = planOrder[a.subscription ?? ''] ?? 3
            const pb = planOrder[b.subscription ?? ''] ?? 3
            if (pa !== pb) return pa - pb
            return b.rating - a.rating
          }
          // 3. sin reclamar: más fuentes arriba (más confiable), luego rating externo
          const sa = a.sourceCount ?? 0, sb = b.sourceCount ?? 0
          if (sa !== sb) return sb - sa
          return (b.externalRating ?? 0) - (a.externalRating ?? 0)
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
