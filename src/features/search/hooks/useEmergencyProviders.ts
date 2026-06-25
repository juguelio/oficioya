import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toProvider } from '@/features/providers/hooks/useProviders'
import { haversineKm } from '@/shared/utils/distance'
import type { Provider } from '@/features/providers/types'
import type { CiudadId } from '@/design-system/tokens'
import type { DbProviderPublic } from '@/lib/database.types'

export type EmergencyProvider = Provider & { distanceKm?: number }

type UserLoc = { lat: number; lng: number }

type UseEmergencyProvidersReturn = {
  providers: EmergencyProvider[]
  total: number
  isEmpty: boolean
  loading: boolean
  error: string | null
}

// Prestadores en modo guardia (is_emergency_available) de la ciudad activa. Sólo pueden
// estar en guardia perfiles activos/reclamados, así que el contacto existe — pero la
// revelación pasa por el paywall (§8), nunca directo desde acá.
export function useEmergencyProviders(
  ciudad: CiudadId | null,
  userLoc?: UserLoc | null,
): UseEmergencyProvidersReturn {
  const [providers, setProviders] = useState<EmergencyProvider[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function run() {
      let query = supabase
        .from('providers_public')
        .select('*')
        .eq('is_emergency_available', true)

      if (ciudad) query = query.eq('ciudad_id', ciudad)

      const { data, error: dbError } = await query
      if (cancelled) return

      if (dbError) {
        setError(dbError.message)
        setLoading(false)
        return
      }

      const mapped: EmergencyProvider[] = (data as DbProviderPublic[])
        .map(toProvider)
        .map((p): EmergencyProvider => {
          if (userLoc && p.lat != null && p.lng != null) {
            return { ...p, distanceKm: haversineKm(userLoc.lat, userLoc.lng, p.lat, p.lng) }
          }
          return p
        })
        .sort((a, b) => {
          // Con geo: el más cercano primero. Sin geo: rating de Oficio desc.
          if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm
          return b.rating - a.rating
        })

      setProviders(mapped)
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [ciudad, userLoc?.lat, userLoc?.lng])

  return {
    providers,
    total:   providers.length,
    isEmpty: !loading && providers.length === 0,
    loading,
    error,
  }
}
