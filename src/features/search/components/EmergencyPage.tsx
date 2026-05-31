import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/shared/utils/cn'

const MAP_IMG      = '/images/emergency-map.png'
const PROVIDER_IMG = '/images/provider-marcos.png'

type EmergencyCategory = 'electricidad' | 'plomeria' | 'gas' | 'cerrajeria'

const categories: { id: EmergencyCategory; label: string; icon: string }[] = [
  { id: 'electricidad', label: 'Electricidad', icon: '⚡' },
  { id: 'plomeria',     label: 'Plomería',     icon: '🔧' },
  { id: 'gas',          label: 'Gas',          icon: '🔥' },
  { id: 'cerrajeria',   label: 'Cerrajería',   icon: '🔑' },
]

// ─── EmergencyPage ────────────────────────────────────────────────────────────

export function EmergencyPage() {
  const navigate       = useNavigate()
  const { user }       = useAuth()
  const [active, setActive] = useState<EmergencyCategory>('electricidad')

  const [providerId,     setProviderId]     = useState<string | null>(null)
  const [guardiaOn,      setGuardiaOn]      = useState(false)
  const [togglePending,  setTogglePending]  = useState(false)
  const [toggleError,    setToggleError]    = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('providers')
      .select('id, is_emergency_available')
      .eq('auth_user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProviderId(data.id)
          setGuardiaOn(data.is_emergency_available)
        }
      })
  }, [user])

  async function handleToggleGuardia() {
    if (!providerId || togglePending) return
    const next = !guardiaOn
    setGuardiaOn(next)
    setTogglePending(true)
    setToggleError(null)
    const { error } = await supabase
      .from('providers')
      .update({ is_emergency_available: next })
      .eq('id', providerId)
    setTogglePending(false)
    if (error) {
      setGuardiaOn(!next)
      setToggleError('No se pudo guardar el cambio. Intentá de nuevo.')
    }
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
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--color-emergency)' }}
          />
          <h1 className="font-bold text-base" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
            Urgencias 24/7
          </h1>
        </div>
      </header>

      <main className="pt-14 pb-24 max-w-xl mx-auto">

        {/* ── Hero map ─────────────────────────────────────────────────────────── */}
        <section className="relative h-[360px] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${MAP_IMG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'grayscale(0.3) brightness(0.7)',
            }}
          />
          {/* gradient to page bg */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(14,31,20,0.3) 0%, transparent 40%, var(--color-noche) 100%)' }}
          />

          {/* Category pills — sobre el mapa */}
          <div className="absolute top-4 left-0 right-0 z-20 px-4 flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={cn(
                  'flex-none px-3 py-2 rounded-full flex items-center gap-1.5 font-semibold text-sm active:scale-95 transition-all border',
                  active === cat.id
                    ? 'text-white'
                    : 'text-white/80',
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

          {/* Map pins */}
          <MapPin top="38%" left="22%" size="lg" />
          <MapPin top="52%" left="60%" size="sm" />
          <MapPin top="42%" right="18%" size="md" />

          {/* Provider card — bottom of map */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-30">
            <div
              className="rounded-[--radius-xl] p-4 border flex items-center justify-between gap-3"
              style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-[--radius-lg] overflow-hidden border flex-shrink-0"
                  style={{ borderColor: 'var(--color-line)' }}
                >
                  <img
                    src={PROVIDER_IMG}
                    alt="Marcos Zúñiga"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = '/images/user-avatar.png' }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-nieve)' }}>
                      Marcos Zúñiga
                    </h3>
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: 'var(--color-guardia)' }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Electricista · A 1.2 km
                  </p>
                  <p
                    className="text-xs font-bold mt-0.5 flex items-center gap-1"
                    style={{ color: 'var(--color-bosque-lt)' }}
                  >
                    <IconClock />
                    Llegada en ~15 min
                  </p>
                </div>
              </div>
              <a
                href="tel:+5492944000010"
                className="flex flex-col items-center justify-center px-4 py-3 rounded-[--radius-lg] active:scale-95 transition-transform flex-shrink-0"
                style={{ backgroundColor: 'var(--color-emergency)', color: '#fff' }}
              >
                <IconPhone />
                <span className="text-[10px] font-bold mt-0.5 uppercase">Llamar</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── Cómo funciona ────────────────────────────────────────────────────── */}
        <section className="px-4 mt-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
            Cómo funciona
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: '1', text: 'Elegís el rubro que necesitás' },
              { n: '2', text: 'Ves quién está de guardia ahora' },
              { n: '3', text: 'Contactás directo — llega en minutos' },
            ].map(step => (
              <div
                key={step.n}
                className="rounded-[--radius-lg] p-3 border text-center"
                style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mx-auto mb-2 text-white"
                  style={{ backgroundColor: 'var(--color-bosque-lt)' }}
                >
                  {step.n}
                </div>
                <p className="text-xs leading-tight" style={{ color: 'var(--color-muted)' }}>
                  {step.text}
                </p>
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
            <h2 className="font-bold text-base mb-1" style={{ color: 'var(--color-nieve)' }}>
              ¿Sos prestador?
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
              Activá el modo guardia y recibí contactos de urgencia en tu zona.
            </p>

            {user && providerId ? (
              <>
                {/* Toggle row — conectado a Supabase */}
                <div
                  className="flex items-center justify-between p-3 rounded-[--radius-lg] border mb-2"
                  style={{ backgroundColor: 'var(--color-noche)', borderColor: 'var(--color-line)' }}
                >
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-nieve)' }}>
                      Modo guardia
                    </p>
                    <p className="text-xs" style={{ color: guardiaOn ? 'var(--color-guardia)' : 'var(--color-muted)' }}>
                      {guardiaOn ? 'Activo — recibís contactos ahora' : 'Inactivo'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleGuardia}
                    disabled={togglePending}
                    className="w-11 h-6 rounded-full relative flex items-center p-0.5 transition-colors flex-shrink-0 border disabled:opacity-60"
                    style={{
                      backgroundColor: guardiaOn ? 'var(--color-bosque-lt)' : 'transparent',
                      borderColor: guardiaOn ? 'var(--color-bosque-lt)' : 'var(--color-muted)',
                    }}
                    role="switch"
                    aria-checked={guardiaOn}
                    aria-label="Activar modo guardia"
                  >
                    <div
                      className="w-5 h-5 rounded-full transition-transform"
                      style={{
                        backgroundColor: guardiaOn ? '#fff' : 'var(--color-muted)',
                        transform: guardiaOn ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />
                  </button>
                </div>
                {toggleError && (
                  <p className="text-xs font-semibold mb-2" style={{ color: '#ffb4ab' }}>{toggleError}</p>
                )}
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
              /* CTAs para no autenticados */
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="py-3 rounded-[--radius-lg] font-bold text-xs text-center text-white active:scale-95 transition-transform"
                  style={{ backgroundColor: 'var(--color-bosque-lt)' }}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro/prestador"
                  className="py-3 border rounded-[--radius-lg] font-bold text-xs text-center active:scale-95 transition-transform"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-nieve)' }}
                >
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

// ─── MapPin ───────────────────────────────────────────────────────────────────

type MapPinProps = {
  top?: string; left?: string; right?: string
  size: 'sm' | 'md' | 'lg'
}

function MapPin({ top, left, right, size }: MapPinProps) {
  const dim = size === 'lg' ? 48 : size === 'md' ? 40 : 32
  const pulse = size === 'lg'
  return (
    <div
      className={cn('absolute z-10 flex flex-col items-center', pulse && 'animate-pulse')}
      style={{ top, left, right }}
    >
      <div
        className="rounded-full border-2 border-white flex items-center justify-center"
        style={{
          width: dim,
          height: dim,
          backgroundColor: 'var(--color-emergency)',
          boxShadow: size === 'lg' ? '0 0 20px rgba(255,79,59,0.5)' : undefined,
        }}
      >
        <IconBoltFill size={dim * 0.45} />
      </div>
      <div
        style={{
          width: 0, height: 0,
          borderLeft: `${dim * 0.15}px solid transparent`,
          borderRight: `${dim * 0.15}px solid transparent`,
          borderTop: `${dim * 0.2}px solid var(--color-emergency)`,
        }}
      />
    </div>
  )
}

// ─── NavTab ───────────────────────────────────────────────────────────────────

type NavTabProps = { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }

function NavTab({ icon, label, active = false, onClick }: NavTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 px-3 py-1 rounded-[--radius-lg] transition-all active:scale-90',
      )}
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

function IconBoltFill({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.75a16 16 0 0 0 8.34 8.34l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
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
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
