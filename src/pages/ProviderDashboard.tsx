import { useRef, useState, useEffect } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { mockProviders } from '@/data/mock-providers'
import { useDashboardStore, getAverageRating } from '@/features/dashboard/store'
import { useDashboardData } from '@/features/dashboard/hooks'
import { CERT_CONFIGS, TRUST_BADGES, getTrustBadge, MAX_CERT_SCORE } from '@/features/dashboard/types'
import { formatARS } from '@/shared/utils/formatARS'
import type { CertType, Review, Certification } from '@/features/dashboard/types'
import type { Provider } from '@/features/providers/types'
import type { DbProviderPublic } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/features/subscriptions/hooks'
import { useOpenJobs } from '@/features/jobs/hooks'
import { toProvider } from '@/shared/utils/toProvider'
import { PageHeader } from '@/shared/components'

const FALLBACK_PHOTO = '/images/user-avatar.png'

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60)  return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

// ─── ProviderDashboard ────────────────────────────────────────────────────────

export function ProviderDashboard() {
  const navigate = useNavigate()
  const { user, loading, signOut } = useAuth()
  const activeProviderId = useDashboardStore(s => s.activeProviderId)
  const setActiveProvider = useDashboardStore(s => s.setActiveProvider)
  const clearActiveProvider = useDashboardStore(s => s.clearActiveProvider)

  // Sesión real: cargar el prestador logueado desde Supabase por auth_user_id.
  // El selector mock queda solo como fallback de desarrollo SIN sesión.
  const [authProvider, setAuthProvider] = useState<Provider | null>(null)
  const [authState, setAuthState] = useState<'loading' | 'none' | 'ready'>('loading')

  useEffect(() => {
    if (loading) return
    if (!user) { setAuthState('none'); return }
    let cancelled = false
    setAuthState('loading')
    supabase
      .from('providers')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) { setAuthState('none'); return }
        // el dashboard lee la fila propia (tabla); tiene los campos de la 018 salvo `claimed`
        // (columna computada de la vista) → la derivamos del status.
        setAuthProvider(toProvider({ ...data, claimed: data.status === 'active' } as unknown as DbProviderPublic))
        setAuthState('ready')
      })
    return () => { cancelled = true }
  }, [user, loading])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  // ⚠️ ESTA GUARDA VA PRIMERA. Leer la sesión de Supabase es asincrónico: en el
  // primer render `user` es null aunque el usuario esté logueado. Sin esto, el
  // bloque "sin sesión" de más abajo se ejecutaba antes de que la sesión cargara
  // y te devolvía a /login — el login parecía roto cuando en realidad el token
  // se había emitido bien. Cualquier redirect por falta de `user` tiene que
  // esperar a que `loading` sea false.
  if (loading) return <DashboardLoading />

  // ── Usuario autenticado ──────────────────────────────────────────────────
  if (user) {
    if (authState === 'loading') return <DashboardLoading />
    if (authState === 'ready' && authProvider) {
      return <DashboardMain provider={authProvider} onExit={handleSignOut} isLive />
    }
    // Logueado SIN fila de prestador. Antes se asumía que toda cuenta venía a darse
    // de alta como prestador y se la empujaba al onboarding conversacional: un
    // cliente que entraba quedaba atrapado en el chat de alta, sin salida. Ahora se
    // respeta a qué vino la cuenta.
    const accountType = (user.user_metadata as { account_type?: string } | undefined)?.account_type
    if (accountType === 'cliente')   return <Navigate to="/mis-trabajos" replace />
    if (accountType === 'prestador') return <Navigate to="/registro/prestador" replace />
    // Sin declarar (típico de Google, que no manda esta info): se pregunta en vez
    // de adivinar. Adivinar "prestador" fue justamente el bug.
    return <ElegiTuCamino onExit={handleSignOut} />
  }

  // ── Sin sesión ───────────────────────────────────────────────────────────
  // En PRODUCCIÓN nunca se muestra el selector mock: sin sesión → al login. Si no,
  // cualquiera podría entrar al panel de cualquier prestador (impersonación) y ver el
  // padrón completo. El selector de perfiles es solo una comodidad de desarrollo.
  if (!import.meta.env.DEV) {
    return <Navigate to="/login" replace />
  }
  const provider = mockProviders.find(p => p.id === activeProviderId) ?? null
  if (!provider) {
    return <ProviderSelector onSelect={setActiveProvider} />
  }
  return <DashboardMain provider={provider} onExit={clearActiveProvider} isLive={false} />
}

// ─── Estados de sesión real ─────────────────────────────────────────────────────

function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-noche">
      <div className="w-full max-w-xl px-5 space-y-3 animate-pulse">
        <div className="h-24 rounded-xl bg-sombra" />
        <div className="h-40 rounded-xl bg-sombra" />
        <div className="h-40 rounded-xl bg-sombra" />
      </div>
    </div>
  )
}

// DashboardPending se eliminó: la pantalla "tu perfil está en preparación" era un
// callejón sin salida — nadie la sacaba de ahí. Ahora ese caso va a /onboarding.

// ─── ElegiTuCamino ────────────────────────────────────────────────────────────
// Hay sesión, no hay fila de prestador y la cuenta no declaró a qué vino (Google
// no lo manda). En vez de asumir "prestador" y empujar al alta, se pregunta.

type ElegiTuCaminoProps = { onExit: () => void }

function ElegiTuCamino({ onExit }: ElegiTuCaminoProps) {
  const navigate = useNavigate()
  const { setAccountType } = useAuth()
  const [saving, setSaving] = useState<'cliente' | 'prestador' | null>(null)

  async function elegir(tipo: 'cliente' | 'prestador') {
    setSaving(tipo)
    await setAccountType(tipo)
    navigate(tipo === 'cliente' ? '/mis-trabajos' : '/registro/prestador', { replace: true })
  }

  return (
    // Con el header de la app: para quien entra con Google, esta es la primera
    // pantalla de Oficio después de la de Google, y sin la barra de marca se
    // llegaba a una página sin logo ni salida. `back` no: atrás es Google.
    <div className="min-h-screen flex flex-col justify-center px-6 pt-24 pb-16 bg-noche">
      <PageHeader back={false} />
      <div className="w-full max-w-md mx-auto">
        <h1 className="font-black text-2xl mb-2" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.03em' }}>
          ¿Qué querés hacer en Oficio?
        </h1>
        <p className="text-sm mb-7 text-muted">
          Ya entraste con tu cuenta. Elegí cómo la vas a usar — después lo podés cambiar.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => elegir('cliente')}
            disabled={saving !== null}
            className="w-full flex items-center gap-4 p-4 rounded-lg border text-left active:scale-[0.98] transition-all disabled:opacity-50 bg-sombra border-line"
          >
            <span className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 bg-brand-tint">
              🏠
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-nieve">Necesito un profesional</p>
              <p className="text-xs text-muted">
                {saving === 'cliente' ? 'Preparando tus trabajos…' : 'Publicar trabajos y recibir presupuestos'}
              </p>
            </div>
          </button>

          <button
            onClick={() => elegir('prestador')}
            disabled={saving !== null}
            className="w-full flex items-center gap-4 p-4 rounded-lg border text-left active:scale-[0.98] transition-all disabled:opacity-50 bg-sombra border-bosque-lt"
          >
            <span className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 bg-brand-tint">
              🔧
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-nieve">Ofrezco mis servicios</p>
              <p className="text-xs text-muted">
                {saving === 'prestador' ? 'Abriendo el alta…' : 'Crear mi perfil de prestador y recibir clientes'}
              </p>
            </div>
          </button>
        </div>

        <button
          onClick={onExit}
          className="w-full mt-6 py-2 text-sm font-semibold text-muted"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}


// ─── ProviderSelector ─────────────────────────────────────────────────────────

type ProviderSelectorProps = { onSelect: (id: string) => void }

function ProviderSelector({ onSelect }: ProviderSelectorProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-noche">
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-3 px-5 h-14 border-b bg-sombra border-line"
      >
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-lg active:scale-90 transition-all bg-noche">
          <IconBack />
        </button>
        <div>
          <p className="font-black text-sm" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.01em' }}>¿Quién sos?</p>
          <p className="text-[10px] text-muted">Elegí tu perfil para acceder al panel</p>
        </div>
      </header>

      <main className="pt-14 pb-8">
        <div className="px-5 pt-5 space-y-2">
          {mockProviders.filter(p => p.status === 'active').map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border text-left active:scale-[0.99] transition-all bg-sombra border-line"
            >
              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-line">
                <img src={p.photos?.[0] ?? FALLBACK_PHOTO} alt={p.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).src = FALLBACK_PHOTO }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate text-nieve">{p.name}</p>
                <p className="text-xs truncate text-muted">
                  {p.rubro.replace(/-/g, ' ')} · {p.ciudad.replace(/-/g, ' ')}
                </p>
              </div>
              {p.subscription && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0"
                  style={{
                    backgroundColor: p.subscription === 'destacado' ? '#F5C84222' : 'var(--color-brand-tint)',
                    color: p.subscription === 'destacado' ? '#C48A00' : 'var(--color-bosque-lt)',
                  }}
                >
                  {p.subscription}
                </span>
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

// ─── DashboardMain ────────────────────────────────────────────────────────────

type DashboardMainProps = { provider: Provider; onExit: () => void; isLive: boolean }

function DashboardMain({ provider, onExit, isLive }: DashboardMainProps) {
  const [tab, setTab] = useState<'resumen' | 'certs' | 'resenas'>('resumen')
  const navigate = useNavigate()

  const data = useDashboardData({
    providerId:     provider.id,
    defaultGuardia: provider.isEmergencyAvailable,
    isLive,
  })

  const myCerts     = data.certifications
  const myReviews   = data.reviews
  const score       = data.score
  const badge       = getTrustBadge(score)
  const isOnGuardia = data.isOnGuardia
  const avgRating   = getAverageRating(myReviews)

  const photo = provider.photos?.[0] ?? FALLBACK_PHOTO

  const { enabled: subsEnabled, status: subStatus, cancel: cancelSub, loading: subLoading } = useSubscription()

  return (
    <div className="min-h-screen bg-noche">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-between px-5 h-14 border-b bg-sombra border-line"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border shrink-0 border-line">
            <img src={photo} alt={provider.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).src = FALLBACK_PHOTO }} />
          </div>
          <p className="font-bold text-sm truncate text-nieve">{provider.name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            <button
              onClick={() => navigate('/perfil')}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border active:scale-95 transition-all border-line text-bosque-lt"
            >
              Editar perfil
            </button>
          )}
          <button
            onClick={onExit}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border active:scale-95 transition-all border-line text-muted"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="pt-14 pb-6">

        {/* ── Tu suscripción (solo con el módulo prendido) ──────────────────────── */}
        {subsEnabled && (
          <section className="mx-5 mt-5 rounded-xl p-5 border bg-sombra border-line">
            <h3 className="font-bold text-sm mb-1 text-nieve">Tu suscripción</h3>
            {subStatus && subStatus.status === 'authorized' ? (
              <>
                <p className="text-xs text-muted">
                  Plan <b className="text-nieve">{subStatus.tier_id}</b> · activa
                  {subStatus.current_period_end && ` · próximo cobro ${new Date(subStatus.current_period_end).toLocaleDateString('es-AR')}`}
                </p>
                <button
                  onClick={() => cancelSub().catch(() => alert('No pudimos cancelar. Probá de nuevo en un momento.'))}
                  disabled={subLoading}
                  className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold border active:scale-95 disabled:opacity-60 border-line text-nieve"
                >
                  Cancelar suscripción
                </button>
              </>
            ) : (
              <p className="text-xs text-muted">
                No tenés una suscripción activa. <button onClick={() => navigate('/planes')} className="font-semibold text-bosque-lt">Ver planes</button>
              </p>
            )}
          </section>
        )}

        {/* ── Hero — score ring + badge ─────────────────────────────────────────── */}
        <div
          className="px-5 py-6 flex items-center gap-5"
          style={{ backgroundColor: 'var(--color-sombra)', borderBottom: `1px solid var(--color-line)` }}
        >
          <ScoreRing score={score} max={MAX_CERT_SCORE} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest mb-1 text-muted">
              Puntuación de confianza
            </p>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold mb-2"
              style={{ backgroundColor: badge.bgColor, color: badge.color }}
            >
              {badge.icon} {badge.label}
            </div>
            <p className="text-xs leading-relaxed text-muted">
              {score < MAX_CERT_SCORE
                ? `Sumá ${MAX_CERT_SCORE - score} pts más subiendo tus certificaciones`
                : '¡Perfil completo al 100%!'
              }
            </p>
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
        <div
          className="sticky top-14 z-40 flex border-b bg-sombra border-line"
        >
          {[
            { key: 'resumen', label: 'Resumen' },
            { key: 'certs',   label: `Certificaciones${myCerts.length > 0 ? ` (${myCerts.length})` : ''}` },
            { key: 'resenas', label: `Reseñas${myReviews.length > 0 ? ` (${myReviews.length})` : ''}` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className="flex-1 py-3 text-xs font-bold transition-all active:scale-95"
              style={{
                color: tab === t.key ? 'var(--color-bosque-lt)' : 'var(--color-muted)',
                borderBottom: tab === t.key ? '2px solid var(--color-bosque-lt)' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────────── */}
        <div className="px-5 pt-5">
          {tab === 'resumen' && (
            <ResumenTab
              provider={provider}
              isOnGuardia={isOnGuardia}
              onToggleGuardia={data.toggleGuardia}
              avgRating={avgRating}
              reviewCount={myReviews.length}
              score={score}
              onNavigate={navigate}
            />
          )}
          {tab === 'certs' && (
            <CertificacionesTab
              certifications={myCerts}
              onAdd={data.addCertification}
              onRemove={data.removeCertification}
            />
          )}
          {tab === 'resenas' && (
            <ResenasTab
              reviews={myReviews}
              providerId={provider.id}
            />
          )}
        </div>

      </main>
    </div>
  )
}

// ─── ResumenTab ───────────────────────────────────────────────────────────────

type ResumenTabProps = {
  provider: Provider
  isOnGuardia: boolean
  onToggleGuardia: () => void
  avgRating: number
  reviewCount: number
  score: number
  onNavigate: (path: string) => void
}

function ResumenTab({ provider, isOnGuardia, onToggleGuardia, avgRating, reviewCount, score, onNavigate }: ResumenTabProps) {
  return (
    <div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: avgRating > 0 ? avgRating.toFixed(1) : '—', label: 'Rating', mono: true, icon: '★', color: '#E8A020' },
          { value: String(reviewCount), label: 'Reseñas', mono: true, icon: '💬', color: 'var(--color-bosque-lt)' },
          { value: String(provider.totalJobs), label: 'Trabajos', mono: true, icon: '🔧', color: 'var(--color-muted)' },
        ].map(s => (
          <div
            key={s.label}
            className="flex flex-col items-center py-4 rounded-lg border bg-sombra border-line"
          >
            <span className="text-xl mb-1">{s.icon}</span>
            <p
              className="font-black text-lg leading-none mb-0.5"
              style={{ color: s.color, fontFamily: s.mono ? 'var(--font-mono)' : undefined, fontVariantNumeric: 'tabular-nums' }}
            >
              {s.value}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <ProviderOpportunities provider={provider} onNavigate={onNavigate} />

      {/* Plan */}
      <div
        className="flex items-center justify-between p-4 rounded-lg border bg-sombra border-line"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-muted">Plan actual</p>
          {provider.subscription ? (
            <span
              className="font-bold text-sm capitalize px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: provider.subscription === 'destacado' ? '#F5C84222' : 'var(--color-brand-tint)',
                color: provider.subscription === 'destacado' ? '#C48A00' : 'var(--color-bosque-lt)',
              }}
            >
              {provider.subscription}
            </span>
          ) : (
            <span className="text-sm text-muted">Sin plan activo</span>
          )}
        </div>
        <button
          onClick={() => onNavigate('/planes')}
          className="text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-all bg-brand-tint text-bosque-lt"
        >
          {provider.subscription ? 'Cambiar' : 'Ver planes'}
        </button>
      </div>

      {/* Modo guardia */}
      <div
        className="flex items-center justify-between p-4 rounded-lg border"
        style={{
          backgroundColor: 'var(--color-sombra)',
          borderColor: isOnGuardia ? 'var(--color-emergency)' : 'var(--color-line)',
        }}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            {isOnGuardia && <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-emergency)', flexShrink: 0 }} />}
            <p className="font-bold text-sm text-nieve">Modo guardia 🔴</p>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            {isOnGuardia
              ? `Estás visible en emergencias. Se cobran ${formatARS(20000)} por contacto.`
              : `Activalo para aparecer primero en urgencias. ${formatARS(20000)} por contacto.`
            }
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isOnGuardia}
          onClick={onToggleGuardia}
          className="relative shrink-0 w-12 h-6 rounded-full transition-all duration-200 active:scale-95"
          style={{ backgroundColor: isOnGuardia ? 'var(--color-emergency)' : 'var(--color-line)' }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
            style={{ left: isOnGuardia ? '26px' : '2px' }}
          />
        </button>
      </div>

      {/* Ver perfil público */}
      <Link
        to={`/prestador/${provider.id}`}
        className="flex items-center justify-between p-4 rounded-lg border active:scale-[0.99] transition-all bg-sombra border-line"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">👁️</span>
          <div>
            <p className="font-bold text-sm text-nieve">Ver perfil público</p>
            <p className="text-xs text-muted">Así te ven los clientes</p>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>

      {/* Score hint */}
      {score < 20 && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg border bg-brand-tint border-bosque-lt"
        >
          <span className="text-xl shrink-0">💡</span>
          <p className="text-xs leading-relaxed text-bosque-lt">
            Subí el DNI y una certificación más para obtener el badge <strong>Verificado</strong> y aparecer con mayor confianza en los resultados.
          </p>
        </div>
      )}

    </div>
  )
}

// ─── Oportunidades ─────────────────────────────────────────────────────────────
// El dashboard ya no deja escondido el motivo principal para volver: encontrar
// clientes de la misma ciudad y rubro, cotizar y recibir la respuesta.
function ProviderOpportunities({ provider, onNavigate }: { provider: Provider; onNavigate: (path: string) => void }) {
  const { jobs, loading } = useOpenJobs({ ciudad: provider.ciudad, rubro: provider.rubro })
  const latest = jobs.filter(job => job.status === 'open').slice(0, 3)

  return (
    <section className="rounded-lg border overflow-hidden bg-sombra border-line">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-muted">Oportunidades</p>
          <h3 className="font-black text-base text-nieve">Trabajos para vos</h3>
          <p className="text-xs mt-1 capitalize text-muted">
            {provider.rubro.replace(/-/g, ' ')} · {provider.ciudad.replace(/-/g, ' ')}
          </p>
        </div>
        <button onClick={() => onNavigate(`/trabajos?ciudad=${encodeURIComponent(provider.ciudad)}&rubro=${encodeURIComponent(provider.rubro)}`)} className="text-xs font-bold shrink-0 text-bosque-lt">
          Ver todos →
        </button>
      </div>

      {loading ? (
        <div className="px-4 pb-4 space-y-2 animate-pulse">
          <div className="h-10 rounded-md bg-noche" />
          <div className="h-10 rounded-md bg-noche" />
        </div>
      ) : latest.length > 0 ? (
        <div className="border-t border-line">
          {latest.map(job => (
            <button
              key={job.id}
              onClick={() => onNavigate(`/trabajos/${job.id}`)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-b last:border-b-0 active:bg-black/[0.02] transition-colors border-line"
            >
              <div className="min-w-0">
                <p className="font-bold text-sm truncate text-nieve">{job.title}</p>
                <p className="text-xs truncate mt-0.5 text-muted">{job.barrio ? `${job.barrio} · ` : ''}{job.description}</p>
              </div>
              <span className="text-xs font-bold shrink-0 text-bosque-lt">Cotizar</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 pb-4">
          <p className="text-xs leading-relaxed text-muted">
            Todavía no hay trabajos abiertos de tu rubro en esta ciudad. Mirá el tablero completo por si aparece uno cercano.
          </p>
        </div>
      )}
    </section>
  )
}

// ─── CertificacionesTab ───────────────────────────────────────────────────────

type CertificacionesTabProps = {
  certifications: Certification[]
  onAdd: (type: CertType, file: File) => void
  onRemove: (type: CertType) => void
}

function CertificacionesTab({ certifications, onAdd, onRemove }: CertificacionesTabProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function handleFileChange(type: CertType, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onAdd(type, file)
    // reset input para permitir re-subir el mismo archivo
    e.target.value = ''
  }

  const totalScore = certifications.reduce((s, c) => s + c.points, 0)

  return (
    <div className="space-y-4">

      {/* Score summary */}
      <div
        className="flex items-center justify-between p-4 rounded-lg border bg-sombra border-line"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-0.5 text-muted">Puntaje total</p>
          <p className="font-black text-2xl" style={{ color: 'var(--color-nieve)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
            {totalScore} <span className="text-sm font-semibold text-muted">/ 100 pts</span>
          </p>
        </div>
        <div className="flex gap-1">
          {TRUST_BADGES.slice(1).map(b => (
            <div
              key={b.minScore}
              className="flex items-center gap-1 px-2 py-1 rounded-full-full text-[10px] font-bold"
              style={{
                backgroundColor: totalScore >= b.minScore ? b.bgColor : 'rgba(0,0,0,0.04)',
                color: totalScore >= b.minScore ? b.color : 'var(--color-muted)',
                opacity: totalScore >= b.minScore ? 1 : 0.4,
              }}
            >
              {b.icon}
            </div>
          ))}
        </div>
      </div>

      {/* Cert cards */}
      <div className="space-y-3">
        {CERT_CONFIGS.map(config => {
          const existing = certifications.find(c => c.type === config.type)
          const isVerified = !!existing

          return (
            <div
              key={config.type}
              className="rounded-lg border overflow-hidden"
              style={{
                backgroundColor: 'var(--color-sombra)',
                borderColor: isVerified ? 'var(--color-bosque-lt)' : 'var(--color-line)',
              }}
            >
              <div className="flex items-center gap-3 p-4">
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: isVerified ? 'var(--color-brand-tint)' : 'rgba(0,0,0,0.04)' }}
                >
                  {config.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-nieve">{config.label}</p>
                  <p className="text-xs text-muted">
                    {isVerified ? existing!.fileName : config.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isVerified ? 'var(--color-brand-tint)' : 'rgba(0,0,0,0.05)',
                      color: isVerified ? 'var(--color-bosque-lt)' : 'var(--color-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    +{config.points}pts
                  </span>
                  {isVerified ? (
                    <button
                      onClick={() => onRemove(config.type)}
                      className="w-7 h-7 flex items-center justify-center rounded-full active:scale-90 transition-all"
                      style={{ backgroundColor: 'rgba(255,180,171,0.15)', color: '#ffb4ab' }}
                      title="Eliminar"
                    >
                      <IconTrash />
                    </button>
                  ) : (
                    <button
                      onClick={() => fileInputRefs.current[config.type]?.click()}
                      className="text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-all text-white bg-bosque-lt"
                    >
                      Subir
                    </button>
                  )}
                </div>
              </div>

              {isVerified && (
                <div
                  className="flex items-center gap-2 px-4 py-2 border-t border-line bg-brand-tint"
                >
                  <span className="text-[10px] font-bold text-bosque-lt">✓ Verificado</span>
                  <span className="text-[10px]" style={{ color: 'var(--color-bosque-lt)', opacity: 0.6 }}>·</span>
                  <span className="text-[10px]" style={{ color: 'var(--color-bosque-lt)', opacity: 0.7 }}>{timeAgo(existing!.uploadedAt)}</span>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={el => { fileInputRefs.current[config.type] = el }}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={e => handleFileChange(config.type, e)}
              />
            </div>
          )
        })}
      </div>

      <p className="text-xs text-center py-2 text-muted">
        Los documentos son revisados por el equipo de Oficio en 24-48hs.
      </p>

    </div>
  )
}

// ─── ResenasTab ───────────────────────────────────────────────────────────────

type ResenasTabProps = { reviews: Review[]; providerId: string }

function ResenasTab({ reviews, providerId }: ResenasTabProps) {
  const avgRating = getAverageRating(reviews)

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <span className="text-5xl mb-4">💬</span>
        <p className="font-bold text-base mb-1 text-nieve">Sin reseñas todavía</p>
        <p className="text-sm text-muted">
          Los clientes pueden dejarte una reseña desde tu perfil público.
        </p>
        <Link
          to={`/prestador/${providerId}`}
          className="mt-5 px-5 py-2.5 rounded-full text-sm font-bold border active:scale-95 transition-all border-line text-nieve"
        >
          Ver perfil público
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Summary */}
      <div
        className="flex items-center gap-4 p-4 rounded-lg border bg-sombra border-line"
      >
        <div className="text-center">
          <p
            className="font-black text-3xl leading-none mb-0.5"
            style={{ color: 'var(--color-nieve)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
          >
            {avgRating.toFixed(1)}
          </p>
          <StarRow rating={avgRating} size={12} />
          <p className="text-[10px] mt-1 text-muted">{reviews.length} reseñas</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => Math.round(r.rating) === star).length
            const pct   = reviews.length > 0 ? (count / reviews.length) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[10px] font-bold w-2 text-muted">{star}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-line">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#E8A020', transition: 'width 0.3s' }} />
                </div>
                <span className="text-[10px] w-4 text-right text-muted font-mono">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {reviews.map(r => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>

    </div>
  )
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className="p-4 rounded-lg border bg-sombra border-line"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 bg-brand-tint text-bosque-lt"
          >
            {review.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm text-nieve">{review.authorName}</p>
            <StarRow rating={review.rating} size={11} />
          </div>
        </div>
        <span className="text-[10px] shrink-0 mt-0.5 text-muted">{timeAgo(review.createdAt)}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted">{review.comment}</p>
    </div>
  )
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────

function ScoreRing({ score, max }: { score: number; max: number }) {
  const r            = 30
  const circumference = 2 * Math.PI * r
  const pct          = Math.min(score / max, 1)
  const fill         = pct * circumference

  const badge = getTrustBadge(score)

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-line)" strokeWidth="7" />
      {/* Progress */}
      <circle
        cx="44" cy="44" r={r}
        fill="none"
        stroke={badge.color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circumference}`}
        transform="rotate(-90 44 44)"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      {/* Score */}
      <text x="44" y="48" textAnchor="middle" fontSize="18" fontWeight="900" fill="var(--color-nieve)" fontFamily="var(--font-mono)">
        {score}
      </text>
    </svg>
  )
}

// ─── StarRow ──────────────────────────────────────────────────────────────────

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#E8A020' : 'var(--color-line)'} style={{ flexShrink: 0 }}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBack() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-nieve"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
}
function IconTrash() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
}
