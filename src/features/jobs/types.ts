import type { CiudadId, RubroId } from '@/design-system/tokens'

export type JobStatus   = 'open' | 'in_progress' | 'closed'
export type QuoteStatus = 'pending' | 'accepted' | 'rejected'

export type Job = {
  id: string
  title: string
  rubro: RubroId
  ciudad: CiudadId
  barrio?: string
  description: string
  budgetMin?: number
  budgetMax?: number
  photos: string[]
  status: JobStatus
  authorName: string
  createdAt: string   // ISO
}

// Trabajo propio visto desde la cuenta del cliente (/mis-trabajos). Incluye el
// client_token porque el dueño ES el cliente: es su acceso al seguimiento.
export type MyJob = {
  id: string
  title: string
  rubro: RubroId
  ciudad: CiudadId
  status: JobStatus
  createdAt: string   // ISO
  clientToken: string
  quoteCount: number
}

export type Quote = {
  id: string
  jobId: string
  providerId?: string        // si viene de un prestador registrado
  providerName: string
  providerPhone?: string     // visible al cliente solo si acepta el presupuesto
  providerRating?: number
  providerVerified?: boolean
  amount: number             // ARS
  message: string
  estimatedDays?: number
  status: QuoteStatus
  createdAt: string          // ISO
}
