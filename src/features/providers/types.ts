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
  status: 'active' | 'inactive' | 'pending'
  lat?: number
  lng?: number
  bio?: string
  photos: string[]
  createdAt: string
  isEmergencyAvailable: boolean
}

export type ProviderStatus = Provider['status']
