import { useMemo } from 'react'
import { mockProviders } from '@/data/mock-providers'
import type { Provider } from '@/features/providers/types'
import type { CiudadId, RubroId } from '@/design-system/tokens'

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
}

export function useProviders(filters: Filters = {}): UseProvidersReturn {
  const providers = useMemo(() => {
    let result = mockProviders.filter(p => p.status === 'active')

    if (filters.ciudad) {
      result = result.filter(p => p.ciudad === filters.ciudad)
    }

    if (filters.rubro) {
      result = result.filter(p => p.rubro === filters.rubro)
    }

    if (filters.soloVerificados) {
      result = result.filter(p => p.isVerified)
    }

    if (filters.soloConPlan) {
      result = result.filter(p => p.subscription !== null)
    }

    // Orden: destacado primero, luego profesional, luego básico
    // Dentro de cada plan: por rating descendente
    const planOrder = { destacado: 0, profesional: 1, basico: 2, null: 3 }
    result.sort((a, b) => {
      const planDiff = (planOrder[a.subscription ?? 'null'] ?? 3) - (planOrder[b.subscription ?? 'null'] ?? 3)
      if (planDiff !== 0) return planDiff
      return b.rating - a.rating
    })

    return result
  }, [filters.ciudad, filters.rubro, filters.soloVerificados, filters.soloConPlan])

  return {
    providers,
    total: providers.length,
    isEmpty: providers.length === 0,
  }
}
