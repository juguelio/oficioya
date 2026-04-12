import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { ciudades, rubros } from '@/design-system/tokens'
import { formatARS } from '@/shared/utils/formatARS'
import { cn } from '@/shared/utils/cn'
import type { DbProvider, DbSubscriptionTier } from '@/lib/database.types'

// ─── ProviderDashboard ────────────────────────────────────────────────────────

export function ProviderDashboard() {
  const navigate            = useNavigate()
  const { user, loading: authLoading, signOut } = useAuth()

  const [provider,     setProvider]     = useState<DbProvider | null>(null)
  const [tier,         setTier]         = useState<DbSubscriptionTier | null>(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError,   setFetchError]   = useState<string | null>(null)

  // Emergency toggle state
  const [isEmergency,    setIsEmergency]    = useState(false)
  const [togglePending,  setTogglePending]  = useState(false)
  const [toggleError,    setToggleError]    = useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    if (!authLoading && user === null) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  // Fetch provider row
  useEffect(() => {
    if (authLoading || user === null) return

    let cancelled = false

    async function fetchProvider() {
      setFetchLoading(true)
      setFetchError(null)

      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('auth_user_id', user!.id)
        .single()

      if (cancelled) return

      if (error || !data) {
        setFetchError('No encontramos tu perfil. Puede que haya sido eliminado.')
        setFetchLoading(false)
        return
      }

      setProvider(data)
      setIsEmergency(data.is_emergency_available)

      if (data.subscription_tier_id) {
        const { data: tierData } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('id', data.subscription_tier_id)
          .single()

        if (!cancelled && tierData) {
          setTier(tierData)
        }
      }

      setFetchLoading(false)
    }

    fetchProvider()
    return () => { cancelled = true }
  }, [authLoading, user])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function handleToggleEmergency() {
    if (!provider || togglePending) return

    const next = !isEmergency
    setIsEmergency(next)   // optimistic
    setTogglePending(true)
    setToggleError(null)

    const { error } = await supabase
      .from('providers')
      .update({ is_emergency_available: next })
      .eq('id', provider.id)

    setTogglePending(false)

    if (error) {
      setIsEmergency(!next)  // revert
      setToggleError('No se pudo guardar el cambio. Intentá de nuevo.')
    }
  }

  // ─── Auth loading / redirecting ────────────────────────────────────────────
  if (authLoading || (!authLoading && user === null)) {
    return <FullSkeleton />
  }

  // ─── Provider fetching ─────────────────────────────────────────────────────
  if (fetchLoading) {
    return <FullSkeleton />
  }

  // ─── Error state ───────────────────────────────────────────────────────────
  if (fetchError || !provider) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6"
        style={{ backgroundColor: '#0e1419' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#ffb4ab18' }}
        >
          <IconAlert />
        </div>
        <div>
          <h2
            className="text-xl font-bold text-[--color-nieve] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Perfil no encontrado
          </h2>
          <p className="text-sm text-[--color-muted] max-w-xs mx-auto">
            {fetchError ?? 'No encontramos tu perfil. Puede que haya sido eliminado.'}
          </p>
        </div>
        <a
          href="mailto:soporte@oficio.ar"
          className="h-12 px-6 rounded-[--radius-full] font-bold text-sm flex items-center gap-2 transition-all active:scale-95"
          style={{ backgroundColor: '#ffb4ab18', color: '#ffb4ab', border: '1px solid #ffb4ab30' }}
        >
          Contactar soporte
        </a>
      </div>
    )
  }

  // ─── Derived display data ──────────────────────────────────────────────────
  const rubroData  = rubros.find(r => r.id === provider.rubro_id)
  const ciudadData = ciudades.find(c => c.id === provider.ciudad_id)

  const tierId = provider.subscription_tier_id as 'basico' | 'profesional' | 'destacado' | null

  const tierStyles = {
    destacado:    { bg: '#F5C842',   text: '#0e1419', label: 'Destacado' },
    profesional:  { bg: '#2E6E8A22', text: '#2E6E8A', label: 'Profesional' },
    basico:       { bg: '#4A8C4922', text: '#4A8C49', label: 'Básico' },
  } as const

  const statusStyles = {
    active:  { color: '#4A8C49', label: 'Activo' },
    pending: { color: '#F5C842', label: 'Pendiente de verificación' },
    inactive:{ color: '#7A9A79', label: 'Inactivo' },
  } as const

  const providerStatus = (provider.status as keyof typeof statusStyles) in statusStyles
    ? (provider.status as keyof typeof statusStyles)
    : 'inactive'

  const statusInfo = statusStyles[providerStatus]

  return (
    <div
      className="min-h-screen text-[--color-nieve]"
      style={{ backgroundColor: '#0e1419' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 backdrop-blur-xl flex items-center justify-between px-6 h-16"
        style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
      >
        <h1
          className="text-lg font-bold text-[--color-nieve]"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          Mi perfil
        </h1>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[--radius-lg] text-sm font-semibold text-[--color-muted] hover:text-[#ffb4ab] hover:bg-white/5 transition-all active:scale-95"
        >
          <IconLogOut />
          Salir
        </button>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="pt-24 pb-32 px-4 max-w-xl mx-auto space-y-4">

        {/* ── Status chip ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusInfo.color }}
          />
          <span
            className="text-xs font-bold tracking-[0.12em] uppercase"
            style={{ color: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* ── Tier / plan card ─────────────────────────────────────────────── */}
        <div
          className="rounded-[--radius-xl] border p-5 space-y-4 hover:border-[#2A3A2A] transition-colors"
          style={{ backgroundColor: '#1a2026', borderColor: '#1E2E1E' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold tracking-[0.15em] text-[--color-muted] uppercase">
                Tu plan actual
              </p>
              {tierId ? (
                <span
                  className="inline-block text-sm font-bold px-3 py-1 rounded-[--radius-full]"
                  style={{
                    backgroundColor: tierStyles[tierId].bg,
                    color:           tierStyles[tierId].text,
                  }}
                >
                  {tierStyles[tierId].label}
                </span>
              ) : (
                <span className="text-sm text-[--color-muted]">Sin plan activo</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/planes')}
              className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-[--radius-lg] transition-all active:scale-95"
              style={{ backgroundColor: '#4A8C4922', color: '#4A8C49' }}
            >
              Cambiar plan
            </button>
          </div>

          {/* Contacts per month */}
          <div className="flex items-center gap-2 text-sm text-[--color-muted]">
            <IconUsers />
            <span>
              {tierId === null
                ? 'Sin plan — sin contactos habilitados'
                : tier === null
                  ? '—'
                  : tier.contacts_per_month === null
                    ? 'Contactos ilimitados'
                    : (
                      <>
                        <span
                          className="font-bold"
                          style={{ fontFamily: 'var(--font-mono)', color: '#EFF3EE' }}
                        >
                          {tier.contacts_per_month}
                        </span>
                        {' contactos por mes'}
                      </>
                    )
              }
            </span>
          </div>

          {!tierId && (
            <button
              type="button"
              onClick={() => navigate('/planes')}
              className="w-full h-11 rounded-[--radius-full] font-bold text-sm transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#4A8C49', color: '#fff' }}
            >
              Elegí un plan para aparecer en búsquedas
            </button>
          )}
        </div>

        {/* ── Emergency toggle card ─────────────────────────────────────────── */}
        <div
          className="rounded-[--radius-xl] border p-5 hover:border-[#2A3A2A] transition-colors"
          style={{ backgroundColor: '#1a2026', borderColor: '#1E2E1E' }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-bold text-[--color-nieve] text-sm">Modo guardia 🔴</p>
              <p className="text-xs text-[--color-muted] leading-relaxed">
                Aparecés primero en búsquedas de emergencia. Se cobran{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#EFF3EE' }}>
                  {formatARS(20000)}
                </span>{' '}
                ARS por contacto.
              </p>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isEmergency}
              disabled={togglePending}
              onClick={handleToggleEmergency}
              className={cn(
                'relative shrink-0 w-14 h-7 rounded-[--radius-full] transition-all duration-200 active:scale-95 disabled:opacity-60',
                isEmergency ? 'bg-[#3de273]/30' : 'bg-[#1E2E1E]',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-5 h-5 rounded-full shadow transition-all duration-200',
                  isEmergency ? 'left-8 bg-[#3de273]' : 'left-1 bg-[#7A9A79]',
                )}
              />
            </button>
          </div>

          {toggleError && (
            <p
              className="mt-3 text-xs font-semibold px-3 py-2 rounded-[--radius-lg]"
              style={{ backgroundColor: '#ffb4ab18', color: '#ffb4ab' }}
            >
              {toggleError}
            </p>
          )}
        </div>

        {/* ── Profile preview card ──────────────────────────────────────────── */}
        <div
          className="rounded-[--radius-xl] border p-5 space-y-4 hover:border-[#2A3A2A] transition-colors"
          style={{ backgroundColor: '#1a2026', borderColor: '#1E2E1E' }}
        >
          <p className="text-xs font-bold tracking-[0.15em] text-[--color-muted] uppercase">
            Así te ven los clientes
          </p>

          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-[--radius-xl] overflow-hidden shrink-0 flex items-center justify-center"
              style={{ backgroundColor: '#0e1419' }}
            >
              {provider.photos.length > 0 ? (
                <img
                  src={provider.photos[0]}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <IconUserCircle />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h2
                className="text-xl font-bold text-[--color-nieve] truncate"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
              >
                {provider.name}
              </h2>

              {/* Rubro + ciudad */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[--color-muted]">
                {rubroData && (
                  <span className="flex items-center gap-1">
                    <span>{rubroData.icon}</span>
                    <span>{rubroData.label}</span>
                  </span>
                )}
                {rubroData && ciudadData && <span className="opacity-40">·</span>}
                {ciudadData && <span>{ciudadData.label}</span>}
              </div>

              {provider.barrio && (
                <p className="text-xs text-[--color-muted]">{provider.barrio}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4">
            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <IconStar />
              <span
                className="text-sm font-bold text-[--color-nieve]"
                style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
              >
                {provider.rating.toFixed(1)}
              </span>
            </div>

            <span className="text-[--color-muted] opacity-40">·</span>

            {/* Total jobs */}
            <span className="text-sm text-[--color-muted]">
              <span
                className="font-bold text-[--color-nieve]"
                style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
              >
                {provider.total_jobs}
              </span>
              {' trabajos'}
            </span>

            {/* Verified badge */}
            {provider.is_verified && (
              <>
                <span className="text-[--color-muted] opacity-40">·</span>
                <span
                  className="flex items-center gap-1 text-xs font-bold"
                  style={{ color: '#4A8C49' }}
                >
                  <IconCheckCircle />
                  Verificado
                </span>
              </>
            )}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => navigate(`/prestador/${provider.id}`)}
            className="w-full h-11 rounded-[--radius-full] font-bold text-sm border transition-all active:scale-[0.98] hover:bg-white/5"
            style={{ borderColor: '#2A3A2A', color: '#EFF3EE' }}
          >
            Ver perfil público
          </button>
        </div>

      </main>
    </div>
  )
}

// ─── Full-screen skeleton ──────────────────────────────────────────────────────

function FullSkeleton() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0e1419' }}
    >
      {/* Header skeleton */}
      <div
        className="fixed top-0 w-full h-16 z-50"
        style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
      >
        <div className="flex items-center justify-between px-6 h-full">
          <div className="h-5 w-24 rounded-[--radius-md] bg-white/5 animate-pulse" />
          <div className="h-7 w-16 rounded-[--radius-lg] bg-white/5 animate-pulse" />
        </div>
      </div>

      <div className="pt-24 pb-32 px-4 max-w-xl mx-auto space-y-4">
        {/* Status chip */}
        <div className="h-4 w-28 rounded-full bg-white/5 animate-pulse" />

        {/* Plan card */}
        <div
          className="rounded-[--radius-xl] border p-5 space-y-4"
          style={{ borderColor: '#1E2E1E', backgroundColor: '#1a2026' }}
        >
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
              <div className="h-6 w-28 rounded-full bg-white/5 animate-pulse" />
            </div>
            <div className="h-8 w-24 rounded-[--radius-lg] bg-white/5 animate-pulse" />
          </div>
          <div className="h-4 w-44 rounded bg-white/5 animate-pulse" />
        </div>

        {/* Emergency card */}
        <div
          className="rounded-[--radius-xl] border p-5 flex items-center justify-between gap-4"
          style={{ borderColor: '#1E2E1E', backgroundColor: '#1a2026' }}
        >
          <div className="space-y-2 flex-1">
            <div className="h-4 w-36 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
          </div>
          <div className="w-14 h-7 rounded-full bg-white/5 animate-pulse shrink-0" />
        </div>

        {/* Profile card */}
        <div
          className="rounded-[--radius-xl] border p-5 space-y-4"
          style={{ borderColor: '#1E2E1E', backgroundColor: '#1a2026' }}
        >
          <div className="h-3 w-40 rounded bg-white/5 animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[--radius-xl] bg-white/5 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-36 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-48 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-12 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="h-11 w-full rounded-full bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconLogOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#ffb4ab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="shrink-0">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#4A8C49"
      stroke="#4A8C49" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconCheckCircle() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function IconUserCircle() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="#7A9A79" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
