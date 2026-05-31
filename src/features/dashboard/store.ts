import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Certification, Review, CertType } from '@/features/dashboard/types'
import { CERT_CONFIGS } from '@/features/dashboard/types'
import { mockReviews } from '@/data/mock-reviews'

type DashboardStore = {
  // Prestador activo ("logueado" en fase 1)
  activeProviderId: string | null
  setActiveProvider: (id: string) => void
  clearActiveProvider: () => void

  // Certificaciones
  certifications: Certification[]
  addCertification: (providerId: string, type: CertType, fileName: string) => void
  removeCertification: (providerId: string, type: CertType) => void

  // Modo guardia (override por prestador)
  guardiaState: Record<string, boolean>
  toggleGuardia: (providerId: string, currentDefault: boolean) => void
  getGuardia: (providerId: string, defaultValue: boolean) => boolean

  // Reseñas
  reviews: Review[]
  addReview: (data: Omit<Review, 'id' | 'createdAt'>) => void
}

let certCounter = 100
let reviewCounter = mockReviews.length + 1

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      activeProviderId: null,

      setActiveProvider: (id) => set({ activeProviderId: id }),
      clearActiveProvider: () => set({ activeProviderId: null }),

      // ── Certificaciones ──────────────────────────────────────────────────
      certifications: [],

      addCertification: (providerId, type, fileName) => {
        // Primero remover si ya existe (reemplazar)
        const config = CERT_CONFIGS.find(c => c.type === type)!
        const cert: Certification = {
          id:         `cert${certCounter++}`,
          providerId,
          type,
          fileName,
          status:     'verified',
          points:     config.points,
          uploadedAt: new Date().toISOString(),
        }
        set(s => ({
          certifications: [
            ...s.certifications.filter(c => !(c.providerId === providerId && c.type === type)),
            cert,
          ],
        }))
      },

      removeCertification: (providerId, type) =>
        set(s => ({
          certifications: s.certifications.filter(
            c => !(c.providerId === providerId && c.type === type)
          ),
        })),

      // ── Modo guardia ─────────────────────────────────────────────────────
      guardiaState: {},

      toggleGuardia: (providerId, currentDefault) =>
        set(s => {
          const current = providerId in s.guardiaState
            ? s.guardiaState[providerId]
            : currentDefault
          return { guardiaState: { ...s.guardiaState, [providerId]: !current } }
        }),

      getGuardia: (providerId, defaultValue) => {
        const state = get().guardiaState
        return providerId in state ? state[providerId] : defaultValue
      },

      // ── Reseñas ──────────────────────────────────────────────────────────
      reviews: mockReviews,

      addReview: (data) => {
        const review: Review = {
          ...data,
          id:        `r${reviewCounter++}`,
          createdAt: new Date().toISOString(),
        }
        set(s => ({ reviews: [review, ...s.reviews] }))
      },
    }),
    { name: 'oficio-dashboard' }
  )
)

// ─── Selectores derivados ──────────────────────────────────────────────────────

export function getCertScore(certs: Certification[], providerId: string): number {
  return certs
    .filter(c => c.providerId === providerId && c.status === 'verified')
    .reduce((sum, c) => sum + c.points, 0)
}

export function getProviderReviews(reviews: Review[], providerId: string): Review[] {
  return reviews
    .filter(r => r.providerId === providerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
}
