import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { Job, JobStatus, QuoteStatus } from '@/features/jobs/types'

// ─── Tipos del seguimiento por token (vista del cliente) ──────────────────────

export type TrackedQuote = {
  id: string
  amount: number
  message: string
  estimatedDays?: number
  status: QuoteStatus
  createdAt: string
  providerName: string
  providerRating?: number
  providerVerified?: boolean
  providerPhone?: string   // sólo presente en el presupuesto aceptado
}

export type TrackedJob = {
  id: string
  title: string
  rubro: RubroId
  ciudad: CiudadId
  barrio?: string
  description: string
  budgetMin?: number
  budgetMax?: number
  status: JobStatus
  authorName: string
  createdAt: string
  acceptedQuoteId?: string
}

type OpenJobRow = {
  id: string; title: string; rubro_id: string; ciudad_id: string; barrio: string | null
  description: string; budget_min: number | null; budget_max: number | null
  photos: string[]; status: string; author_name: string; created_at: string; quote_count: number | null
}

function mapBoardJob(r: OpenJobRow): Job {
  return {
    id: r.id, title: r.title, rubro: r.rubro_id as RubroId, ciudad: r.ciudad_id as CiudadId,
    barrio: r.barrio ?? undefined, description: r.description,
    budgetMin: r.budget_min ?? undefined, budgetMax: r.budget_max ?? undefined,
    photos: r.photos ?? [], status: r.status as JobStatus, authorName: r.author_name, createdAt: r.created_at,
  }
}

// ─── Board público (vista sanitizada open_jobs) ───────────────────────────────

type BoardFilters = { ciudad?: CiudadId | null; rubro?: RubroId | null }

export function useOpenJobs(filters: BoardFilters = {}) {
  const [jobs, setJobs]               = useState<Job[]>([])
  const [counts, setCounts]           = useState<Record<string, number>>({})
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    async function run() {
      let q = supabase.from('open_jobs').select('*').order('created_at', { ascending: false })
      if (filters.ciudad) q = q.eq('ciudad_id', filters.ciudad)
      if (filters.rubro)  q = q.eq('rubro_id', filters.rubro)
      const { data } = await q
      if (cancelled) return
      const rows = (data ?? []) as OpenJobRow[]
      setJobs(rows.map(mapBoardJob))
      setCounts(Object.fromEntries(rows.map(r => [r.id, r.quote_count ?? 0])))
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [filters.ciudad, filters.rubro])

  return { jobs, quoteCountByJob: counts, total: jobs.length, loading }
}

// ─── Publicar un trabajo (RPC) ────────────────────────────────────────────────

export type NewJobInput = {
  title: string; rubro: RubroId; ciudad: CiudadId; description: string
  authorName: string; authorPhone: string; budgetMax?: number; barrio?: string
}

export async function postJob(input: NewJobInput): Promise<{ id: string; token: string } | null> {
  const { data, error } = await supabase.rpc('post_job', {
    p_title:       input.title,
    p_rubro:       input.rubro,
    p_ciudad:      input.ciudad,
    p_description: input.description,
    p_author_name: input.authorName,
    p_author_phone: input.authorPhone,
    p_budget_max:  input.budgetMax ?? null,
    p_barrio:      input.barrio ?? null,
  })
  if (error || !data) return null
  const r = data as { id: string; token: string }
  return { id: r.id, token: r.token }
}

// ─── Seguimiento por token (cliente) ──────────────────────────────────────────

export function useJobTracking(token: string | null) {
  const [job, setJob]         = useState<TrackedJob | null>(null)
  const [quotes, setQuotes]   = useState<TrackedQuote[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!token) { setJob(null); setQuotes([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase.rpc('get_job_by_token', { p_token: token })
    if (!data) { setJob(null); setQuotes([]); setLoading(false); return }
    const d = data as Record<string, unknown>
    setJob({
      id: d.id as string, title: d.title as string, rubro: d.rubro_id as RubroId, ciudad: d.ciudad_id as CiudadId,
      barrio: (d.barrio as string) ?? undefined, description: d.description as string,
      budgetMin: (d.budget_min as number) ?? undefined, budgetMax: (d.budget_max as number) ?? undefined,
      status: d.status as JobStatus, authorName: d.author_name as string, createdAt: d.created_at as string,
      acceptedQuoteId: (d.accepted_quote_id as string) ?? undefined,
    })
    const qs = (d.quotes as Record<string, unknown>[]) ?? []
    setQuotes(qs.map(q => ({
      id: q.id as string, amount: q.amount as number, message: q.message as string,
      estimatedDays: (q.estimated_days as number) ?? undefined, status: q.status as QuoteStatus,
      createdAt: q.created_at as string, providerName: q.provider_name as string,
      providerRating: (q.provider_rating as number) ?? undefined,
      providerVerified: (q.provider_verified as boolean) ?? undefined,
      providerPhone: (q.provider_phone as string) ?? undefined,
    })))
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  async function accept(quoteId: string): Promise<{ providerName: string; providerPhone: string } | null> {
    if (!token) return null
    const { data } = await supabase.rpc('accept_quote_by_token', { p_token: token, p_quote_id: quoteId })
    await load()
    const r = data as { provider_name?: string; provider_phone?: string; error?: string } | null
    if (!r || r.error || !r.provider_phone) return null
    return { providerName: r.provider_name ?? '', providerPhone: r.provider_phone }
  }

  return { job, quotes, loading, accept, refetch: load }
}

// ─── Vista del prestador sobre un trabajo (ofertar) ───────────────────────────

type ProviderCtx = { id: string; active: boolean } | null

export function useProviderJobView(jobId: string) {
  const [job, setJob]         = useState<Job | null>(null)
  const [provider, setProvider] = useState<ProviderCtx>(null)
  const [myQuoteStatus, setMyQuoteStatus] = useState<QuoteStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id ?? null

    const [{ data: jobRow }, prov] = await Promise.all([
      supabase.from('open_jobs').select('*').eq('id', jobId).maybeSingle(),
      uid
        ? supabase.from('providers').select('id,status').eq('auth_user_id', uid).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    setJob(jobRow ? mapBoardJob(jobRow as OpenJobRow) : null)

    const provRow = (prov as { data: { id: string; status: string } | null }).data
    const ctx: ProviderCtx = provRow ? { id: provRow.id, active: provRow.status === 'active' } : null
    setProvider(ctx)

    if (ctx) {
      const { data: myQ } = await supabase
        .from('quotes').select('status').eq('job_id', jobId).eq('provider_id', ctx.id).maybeSingle()
      setMyQuoteStatus(myQ ? (myQ.status as QuoteStatus) : null)
    } else {
      setMyQuoteStatus(null)
    }
    setLoading(false)
  }, [jobId])

  useEffect(() => { load() }, [load])

  async function submitQuote(amount: number, message: string, estimatedDays?: number): Promise<boolean> {
    if (!provider || !provider.active) return false
    const { error } = await supabase.from('quotes').insert({
      job_id: jobId, provider_id: provider.id, amount, message, estimated_days: estimatedDays ?? null,
    })
    if (error) return false
    await load()
    return true
  }

  return { job, provider, myQuoteStatus, loading, submitQuote, refetch: load }
}
