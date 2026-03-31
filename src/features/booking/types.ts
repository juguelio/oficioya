import type { CiudadId, RubroId } from '@/design-system/tokens'

export type JobStatus = 'pending' | 'accepted' | 'in_progress' | 'done' | 'cancelled'

export type JobRequest = {
  id: string
  clientId: string
  providerId: string
  rubro: RubroId
  description: string
  ciudad: CiudadId
  status: JobStatus
  createdAt: string
}
