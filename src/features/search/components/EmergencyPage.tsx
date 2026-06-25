import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCityStore } from '@/features/search/store'
import { useEmergencyProviders } from '@/features/search/hooks/useEmergencyProviders'
import { EmergencyMap } from '@/features/search/components/EmergencyMap'
import { ciudades, rubros } from '@/design-system/tokens'
import { formatDistance } from '@/shared/utils/distance'
import { cn } from '@/shared/utils/cn'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { EmergencyProvider } from '@/features/search/hooks/useEmergencyProviders'

type Filter = RubroId | 'todas'
type LatLng = { lat: number; lng: number }

const categories: { id: Filter; label: string; icon: string }[] = [
  { id: 'todas',        label: 'Todas',       icon: '🚨' },
  { id: 'electricista', label: 'Electricidad', icon: '⚡' },
  { id: 'plomero',      label: 'Plomería',    icon: '🔧' },
  { id: 'gasista',      label: 'Gas',         icon: '🔥' },
  { id: 'cerrajero',    label: 'Cerrajería',  icon: '🔑' },
]

// ─── EmergencyPage ────────────────────────────────────────────────────────────

export function EmergencyPage() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const ciudadId     = useCityStore(s => s.ciudadId)
  const ciudad: CiudadId = ciudadId ?? 'san-martin'   // foco fase 1: SMA por defecto

  const [active, setActive]   = useState<Filter>('todas')
  const [userLoc, setUserLoc] = useState<LatLng | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Geolocalización opcional (progressive enhancement): si no hay permiso, centramos en la ciudad.
  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* sin permiso → centro en la ciudad */ },
      { timeout: 8000, maximumAge: 60000 },
    )
  }, [])

  const { providers, loading, error } = useEmergencyProviders(ciudad, userLoc)

  const shown = useMemo(
    () => (active === 'todas' ? providers : providers.filter(p => p.rubro === active)),
    [providers, active],
  )

  const cityCenter = ciudades.find(c => c.id === ciudad)!

  // Toggle modo guardia (prestador autenticado) — sin cambios respecto del flujo previo.
  const [providerId,    setProviderId]    = useState<string | null>(null)
  const [guardiaOn,     setGuardiaOn]      = useState(false)
  const [togglePending, setTogglePending]  = useState(false)
  const [toggleError,   setToggleError]    = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('providers')
      .select('id, is_emergency_available')
      .eq('auth_user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) { setProviderId(data.id); setGuardiaOn(data.is_emergency_available) }
      })
  }, [user])

  async function handleToggleGuardia() {
    if (!providerId || togglePending) return
    const next = !guardiaOn
    setGuardiaOn(next)
    setTogglePending(true)
    setToggleError(null)
    const { error: upErr } = await supabase
      .from('providers')
      .update({ is_emergency_available: next })
      .eq('id', providerId)
    setTogglePending(false)
    if (upErr) { setGuardiaOn(!next); setToggleError('No se pudo guardar el cambio. Intentá de nuevo.') }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-noche)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-3 px-5 h-14 border-b"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-black/5 transition-colors active:scale-95"
          style={{ color: 'var(--color-bosque-lt)' }}
          aria-label="Volver"
        >
          <IconArrowLeft />
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-emergency)' }} />
          <h1 className="font-bold text-base" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
            Urgencias 24/7
          </h1>
        </div>
        <span className="ml-auto text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
          {cityCenter.label}
        </span>
      </header>

      <main className="pt-14 pb-24 max-w-xl mx-auto">

        {/* ── Hero: mapa real ──────────────────────────────────────────────────── */}
        <section className="relative h-[360px] overflow-hidden">
          <EmergencyMap
            className="absolute inset-0"
            center={{ lat: cityCenter.lat, lng: cityCenter.lng }}
            userLoc={userLoc}
            providers={shown}
            activeId={selectedId}
            onSelect={setSelectedId}
          />

          {/* Gradiente al fondo de página (no tapa el mapa arriba) */}
          <div
            className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--color-noche))' }}
          />

          {/* Pills de categoría sobre el mapa */}
          <div className="absolute top-4 left-0 right-0 z-20 px-4 flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={cn(
                  'flex-none px-3 py-2 rounded-full flex items-center gap-1.5 font-semibold text-sm active:scale-95 transition-all border',
                  active === cat.id ? 'text-white' : 'text-white/80',
                )}
                style={
                  active === cat.id
                    ? { backgroundColor: 'var(--color-emergency)', borderColor: 'transparent' }
                    : { backgroundColor: 'rgba(0,0,0,0.45)', borderColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }
                }
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Lista en vivo ────────────────────────────────────────────────────── */}
        <section className="px-4 -mt-4 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
              En guardia ahora
            </p>
            {!loading && (
              <span className="text-xs font-bold" style={{ color: 'var(--color-guardia)', fontFamily: 'var(--font-mono)' }}>
                {shown.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map(i => (
                <div key={i} className="h-24 rounded-[--radius-xl] animate-pulse border" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[--radius-xl] p-5 border text-center" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No pudimos cargar los prestadores. Probá de nuevo.</p>
            </div>
          ) : shown.length === 0 ? (
            <div className="rounded-[--radius-xl] p-6 border text-center" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
              <span className="text-3xl">🌙</span>
              <p className="text-sm font-bold mt-2" style={{ color: 'var(--color-nieve)' }}>
                No hay prestadores en guardia ahora en {cityCenter.label}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Probá con otra categoría o volvé a chequear en un rato.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map(p => (
                <EmergencyCard
                  key={p.id}
                  provider={p}
                  highlighted={selectedId === p.id}
                  onFocus={() => setSelectedId(p.id)}
                  onContact={() => navigate(`/emergencias/contratar/${p.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Cómo funciona ────────────────────────────────────────────────────── */}
        <section className="px-4 mt-7">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
            Cómo funciona
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: '1', text: 'Elegís el rubro que necesitás' },
              { n: '2', text: 'Ves quién está de guardia ahora' },
              { n: '3', text: 'Pagás el contacto y te llega en minutos' },
            ].map(step => (
              <div key={step.n} className="rounded-[--radius-lg] p-3 border text-center" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mx-auto mb-2 text-white" style={{ backgroundColor: 'var(--color-bosque-lt)' }}>
                  {step.n}
                </div>
                <p className="text-xs leading-tight" style={{ color: 'var(--color-muted)' }}>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Panel prestador ──────────────────────────────────────────────────── */}
        <section className="px-4 mt-6">
          <div
            className="rounded-[--radius-xl] p-5 border"
            style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)', borderLeft: '3px solid var(--color-bosque-lt)' }}
          >
            <h2 className="font-bold text-base mb-1" style={{ color: 'var(--color-nieve)' }}>¿Sos prestador?</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
              Activá el modo guardia y recibí contactos de urgencia en tu zona.
            </p>

            {user && providerId ? (
              <>
                <div
                  className="flex items-center justify-between p-3 rounded-[--radius-lg] border mb-2"
                  style={{ backgroundColor: 'var(--color-noche)', borderColor: 'var(--color-line)' }}
                >
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-nieve)' }}>Modo guardia</p>
                    <p className="text-xs" style={{ color: guardiaOn ? 'var(--color-guardia)' : 'var(--color-muted)' }}>
                      {guardiaOn ? 'Activo — recibís contactos ahora' : 'Inactivo'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleGuardia}
                    disabled={togglePending}
                    className="w-11 h-6 rounded-full relative flex items-center p-0.5 transition-colors flex-shrink-0 border disabled:opacity-60"
                    style={{ backgroundColor: guardiaOn ? 'var(--color-bosque-lt)' : 'transparent', borderColor: guardiaOn ? 'var(--color-bosque-lt)' : 'var(--color-muted)' }}
                    role="switch"
                    aria-checked={guardiaOn}
                    aria-label="Activar modo guardia"
                  >
                    <div className="w-5 h-5 rounded-full transition-transform" style={{ backgroundColor: guardiaOn ? '#fff' : 'var(--color-muted)', transform: guardiaOn ? 'translateX(20px)' : 'translateX(0)' }} />
                  </button>
                </div>
                {toggleError && <p className="text-xs font-semibold mb-2" style={{ color: '#ffb4ab' }}>{toggleError}</p>}
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 rounded-[--radius-lg] font-bold text-xs text-center border transition-all active:scale-95"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-nieve)' }}
                >
                  Ir a mi panel
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="py-3 rounded-[--radius-lg] font-bold text-xs text-center text-white active:scale-95 transition-transform" style={{ backgroundColor: 'var(--color-bosque-lt)' }}>
                  Iniciar sesión
                </Link>
                <Link to="/registro/prestador" className="py-3 border rounded-[--radius-lg] font-bold text-xs text-center active:scale-95 transition-transform" style={{ borderColor: 'var(--color-line)', color: 'var(--color-nieve)' }}>
                  Registrarme
                </Link>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* ── Bottom Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 border-t"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <NavTab icon={<IconExplore />} label="Explorar" onClick={() => navigate('/')} />
        <NavTab icon={<IconEmergency />} label="Urgencias" active />
        <NavTab icon={<IconChat />} label="Mensajes" />
        <NavTab icon={<IconPerson />} label="Perfil" />
      </nav>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

// ─── EmergencyCard ──────────────────────────────────────────────────────────────

type EmergencyCardProps = {
  provider: EmergencyProvider
  highlighted: boolean
  onFocus: () => void
  onContact: () => void
}

function EmergencyCard({ provider, highlighted, onFocus, onContact }: EmergencyCardProps) {
  const rubro = rubros.find(r => r.id === provider.rubro)
  return (
    <div
      onClick={onFocus}
      className="rounded-[--radius-xl] p-4 border flex items-center justify-between gap-3 cursor-pointer transition-all"
      style={{
        backgroundColor: 'var(--color-sombra)',
        borderColor: highlighted ? 'var(--color-emergency)' : 'var(--color-line)',
      }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--color-guardia)' }} />
          <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-nieve)' }}>{provider.name}</h3>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {rubro?.icon} {rubro?.label}
          {provider.distanceKm != null && (
            <span style={{ color: 'var(--color-bosque-lt)' }}> · a {formatDistance(provider.distanceKm)}</span>
          )}
        </p>
        {provider.rating > 0 && (
          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--color-nieve)', fontFamily: 'var(--font-mono)' }}>
            ★ {provider.rating.toFixed(1)}
          </p>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onContact() }}
        className="flex flex-col items-center justify-center px-4 py-3 rounded-[--radius-lg] active:scale-95 transition-transform flex-shrink-0"
        style={{ backgroundColor: 'var(--color-emergency)', color: '#fff' }}
      >
        <IconBolt />
        <span className="text-[10px] font-bold mt-0.5 uppercase">Contactar</span>
      </button>
    </div>
  )
}

// ─── NavTab ───────────────────────────────────────────────────────────────────

type NavTabProps = { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }

function NavTab({ icon, label, active = false, onClick }: NavTabProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 py-1 rounded-[--radius-lg] transition-all active:scale-90"
      style={{ color: active ? 'var(--color-emergency)' : 'var(--color-muted)' }}
    >
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function IconExplore() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function IconEmergency() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconPerson() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}
