import type { CiudadId, RubroId } from '@/design-system/tokens'

export type ProviderDoc = {
  path:   string   // ruta en el bucket privado provider-docs
  subido: string   // ISO
}

// Prestador en la cola de revisión del admin.
export type QueueProvider = {
  id:             string
  name:           string
  ciudad:         CiudadId
  rubro:          RubroId
  whatsappNumber: string | null
  bio:            string | null
  isVerified:     boolean
  claimedAt:      string | null
  createdAt:      string
  docs:           ProviderDoc[]
}
