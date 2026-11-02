import type { Provider } from '@/shared/types'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { DbProviderPublic } from '@/lib/database.types'

// Mapper puro fila DB → Provider. Vive en shared/ porque lo consumen dos features
// (providers y search) y una feature no puede importar de otra (§3).
export function toProvider(row: DbProviderPublic): Provider {
  return {
    id:           row.id,
    name:         row.name,
    rubro:        row.rubro_id as RubroId,
    rubros:       (row.rubros ?? [row.rubro_id]) as RubroId[],
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
