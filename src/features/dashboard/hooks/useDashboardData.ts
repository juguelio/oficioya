import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useDashboardStore, getProviderReviews } from '@/features/dashboard/store'
import { CERT_CONFIGS } from '@/features/dashboard/types'
import type { Certification, Review, CertType } from '@/features/dashboard/types'

// Filas de Supabase → tipos del feature
type CertRow = {
  id: string; provider_id: string; type: string; file_name: string
  file_path: string | null; status: string; points: number; uploaded_at: string
}
type ReviewRow = {
  id: string; provider_id: string; author_name: string; rating: number; comment: string; created_at: string
}

function toCert(c: CertRow): Certification {
  return { id: c.id, providerId: c.provider_id, type: c.type as CertType, fileName: c.file_name, status: 'verified', points: c.points, uploadedAt: c.uploaded_at }
}
function toReview(r: ReviewRow): Review {
  return { id: r.id, providerId: r.provider_id, authorName: r.author_name, rating: r.rating, comment: r.comment, createdAt: r.created_at }
}

export type DashboardData = {
  loading: boolean
  certifications: Certification[]
  reviews: Review[]
  score: number
  isOnGuardia: boolean
  toggleGuardia: () => void
  addCertification: (type: CertType, file: File) => void
  removeCertification: (type: CertType) => void
}

type Args = { providerId: string; defaultGuardia: boolean; isLive: boolean }

// Panel del prestador. Si isLive (sesión real), lee/escribe Supabase.
// Si no (preview mock de desarrollo), delega en el store Zustand existente.
export function useDashboardData({ providerId, defaultGuardia, isLive }: Args): DashboardData {
  // Store path — los hooks se llaman siempre (reglas de hooks)
  const storeCerts      = useDashboardStore(s => s.certifications)
  const storeReviews    = useDashboardStore(s => s.reviews)
  const storeGuardia    = useDashboardStore(s => s.guardiaState)
  const storeToggle     = useDashboardStore(s => s.toggleGuardia)
  const storeAddCert    = useDashboardStore(s => s.addCertification)
  const storeRemoveCert = useDashboardStore(s => s.removeCertification)

  const [liveCerts, setLiveCerts]     = useState<Certification[]>([])
  const [liveReviews, setLiveReviews] = useState<Review[]>([])
  const [liveGuardia, setLiveGuardia] = useState(defaultGuardia)
  const [loading, setLoading]         = useState(isLive)

  const reload = useCallback(async () => {
    const [certsRes, revsRes] = await Promise.all([
      supabase.from('certifications').select('*').eq('provider_id', providerId),
      supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }),
    ])
    setLiveCerts((certsRes.data ?? []).map(c => toCert(c as CertRow)))
    setLiveReviews((revsRes.data ?? []).map(r => toReview(r as ReviewRow)))
  }, [providerId])

  useEffect(() => {
    if (!isLive) return
    let cancelled = false
    setLoading(true)
    setLiveGuardia(defaultGuardia)
    reload().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isLive, reload, defaultGuardia])

  // ── Path mock (dev, sin sesión) ──────────────────────────────────────────────
  if (!isLive) {
    const certs = storeCerts.filter(c => c.providerId === providerId)
    return {
      loading: false,
      certifications: certs,
      reviews: getProviderReviews(storeReviews, providerId),
      score: certs.reduce((s, c) => s + c.points, 0),
      isOnGuardia: providerId in storeGuardia ? storeGuardia[providerId] : defaultGuardia,
      toggleGuardia: () => storeToggle(providerId, defaultGuardia),
      addCertification: (type, file) => storeAddCert(providerId, type, file.name),
      removeCertification: (type) => storeRemoveCert(providerId, type),
    }
  }

  // ── Path live (Supabase) ─────────────────────────────────────────────────────
  async function toggleGuardiaLive() {
    const next = !liveGuardia
    setLiveGuardia(next) // optimista
    const { error } = await supabase.from('providers').update({ is_emergency_available: next }).eq('id', providerId)
    if (error) setLiveGuardia(!next) // revertir si falla
  }

  async function addCertificationLive(type: CertType, file: File) {
    const points = CERT_CONFIGS.find(c => c.type === type)?.points ?? 0
    let filePath: string | null = null
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id
    if (uid) {
      const ext  = file.name.split('.').pop() ?? 'pdf'
      const path = `${uid}/${type}.${ext}`
      await supabase.storage.from('provider-docs').remove([path]).catch(() => {})
      const { error: upErr } = await supabase.storage
        .from('provider-docs')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (!upErr) filePath = path
    }
    await supabase.from('certifications').upsert(
      { provider_id: providerId, type, file_name: file.name, file_path: filePath, status: 'verified', points },
      { onConflict: 'provider_id,type' },
    )
    await reload()
  }

  async function removeCertificationLive(type: CertType) {
    await supabase.from('certifications').delete().eq('provider_id', providerId).eq('type', type)
    await reload()
  }

  return {
    loading,
    certifications: liveCerts,
    reviews: liveReviews,
    score: liveCerts.reduce((s, c) => s + c.points, 0),
    isOnGuardia: liveGuardia,
    toggleGuardia: () => { void toggleGuardiaLive() },
    addCertification: (type, file) => { void addCertificationLive(type, file) },
    removeCertification: (type) => { void removeCertificationLive(type) },
  }
}
