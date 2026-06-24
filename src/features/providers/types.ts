import type { CiudadId, RubroId } from '@/design-system/tokens'

export type Provider = {
  id: string
  name: string
  rubro: RubroId
  ciudad: CiudadId
  barrio?: string
  phone: string
  rating: number
  totalJobs: number
  isVerified: boolean
  subscription: 'basico' | 'profesional' | 'destacado' | null
  status: 'active' | 'inactive' | 'pending' | 'unclaimed'
  lat?: number
  lng?: number
  bio?: string
  photos: string[]
  createdAt: string
  isEmergencyAvailable: boolean
  // Perfiles reclamables: claimed=false → contacto oculto, rating externo (Google), sin verificar
  claimed: boolean
  externalRating?: number
  externalReviews?: number
  sourceCount?: number
}

export type ProviderStatus = Provider['status']
