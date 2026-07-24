import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type ProviderReview = {
  id: string
  authorName: string
  rating: number
  comment: string
  createdAt: string
}

type ReviewRow = {
  id: string
  provider_id: string
  author_name: string
  rating: number
  comment: string
  created_at: string
}

type SubmitInput = { authorName: string; rating: number; comment: string }
type SubmitResult = { ok: true } | { ok: false; message: string }

type UseReviewsReturn = {
  reviews: ProviderReview[]
  avgRating: number
  loading: boolean
  submitReview: (input: SubmitInput) => Promise<SubmitResult>
}

function toReview(r: ReviewRow): ProviderReview {
  return {
    id:         r.id,
    authorName: r.author_name,
    rating:     r.rating,
    comment:    r.comment,
    createdAt:  r.created_at,
  }
}

// Reseñas reales de Supabase (tabla `reviews`, migración ..011). La escritura va
// por el RPC security-definer `submit_review` (migración ..021) — la tabla es
// service-role-only para escritura.
export function useReviews(providerId: string | undefined): UseReviewsReturn {
  const [reviews, setReviews] = useState<ProviderReview[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!providerId) { setReviews([]); setLoading(false); return }
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
    setReviews(((data ?? []) as ReviewRow[]).map(toReview))
    setLoading(false)
  }, [providerId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    reload().finally(() => { if (cancelled) return })
    return () => { cancelled = true }
  }, [reload])

  const submitReview = useCallback(async (input: SubmitInput): Promise<SubmitResult> => {
    if (!providerId) return { ok: false, message: 'Prestador inválido.' }
    const { error } = await supabase.rpc('submit_review', {
      p_provider_id: providerId,
      p_author_name: input.authorName,
      p_rating:      input.rating,
      p_comment:     input.comment,
    })
    if (error) {
      return { ok: false, message: error.message.includes('límite') ? 'Este perfil ya recibió muchas reseñas hoy. Probá mañana.' : 'No pudimos publicar tu reseña. Probá de nuevo.' }
    }
    await reload()
    return { ok: true }
  }, [providerId, reload])

  const avgRating = reviews.length === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  return { reviews, avgRating, loading, submitReview }
}
