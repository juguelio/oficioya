import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'

const MAP_IMG      = '/images/emergency-map.png'
const PROVIDER_IMG = '/images/provider-marcos.png'

type EmergencyCategory = 'electricidad' | 'plomeria' | 'gas' | 'cerrajeria'

const categories: { id: EmergencyCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'electricidad', label: 'Electricidad', icon: <IconBolt /> },
  { id: 'plomeria',     label: 'Plomería',     icon: <IconPlumbing /> },
  { id: 'gas',          label: 'Gas',          icon: <IconGas /> },
  { id: 'cerrajeria',   label: 'Cerrajería',   icon: <IconLock /> },
]

// ─── EmergencyPage ────────────────────────────────────────────────────────────

export function EmergencyPage() {
  const navigate                    = useNavigate()
  const [active, setActive]         = useState<EmergencyCategory>('electricidad')
  const [guardiaOn, setGuardiaOn]   = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0e1419' }}>

      {/* ── TopAppBar ───────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 backdrop-blur-xl flex items-center gap-4 px-6 h-16"
        style={{ backgroundColor: 'rgba(14,20,25,0.80)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-[--color-bosque-lt] p-2 rounded-xl hover:bg-white/5 transition-colors active:scale-95"
          aria-label="Volver"
        >
          <IconArrowLeft />
        </button>
        <h1
          className="text-xl font-bold text-[--color-nieve]"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          Auxilio Inmediato
        </h1>
      </header>

      <main className="pt-16 pb-24 flex flex-col min-h-screen">

        {/* ── Map section ─────────────────────────────────────────────────────── */}
        <section className="relative flex-grow min-h-[500px] overflow-hidden">

          {/* Map background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${MAP_IMG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'grayscale(1) brightness(0.5)',
              opacity: 0.8,
            }}
          />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, #0e1419 0%, transparent 30%, rgba(14,20,25,0.4) 100%)',
            }}
          />

          {/* Filter pills */}
          <div className="absolute top-4 left-0 right-0 z-20 px-4 flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={cn(
                  'flex-none backdrop-blur px-4 py-2.5 rounded-full flex items-center gap-2 font-bold text-sm shadow-lg active:scale-95 transition-all',
                  active === cat.id
                    ? 'border border-[#ffb4ab]/50 text-[#ffb4ab]'
                    : 'border border-[#414845]/30 text-[--color-nieve]',
                )}
                style={{ backgroundColor: active === cat.id ? 'rgba(47,53,59,0.9)' : 'rgba(26,32,38,0.9)' }}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Map pins */}
          <div className="absolute top-[35%] left-[25%] z-10 cursor-pointer">
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white"
                style={{
                  backgroundColor: '#ffb4ab',
                  boxShadow: '0 0 20px rgba(255,180,171,0.6)',
                  animation: 'pulse 2s infinite',
                }}
              >
                <IconBoltFilled />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0"
                style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #ffb4ab' }}
              />
            </div>
          </div>

          <div className="absolute top-[55%] left-[65%] z-10 cursor-pointer opacity-80">
            <div className="relative scale-90">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                style={{ backgroundColor: '#3de273' }}
              >
                <IconPlumbingFilled />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0"
                style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #3de273' }}
              />
            </div>
          </div>

          <div className="absolute top-[45%] right-[20%] z-10 cursor-pointer">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center border-4 border-white"
                style={{
                  backgroundColor: '#ffb4ab',
                  boxShadow: '0 0 30px rgba(255,180,171,0.8)',
                }}
              >
                <IconBoltFilled size={24} />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0"
                style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #ffb4ab' }}
              />
            </div>
          </div>

          {/* Provider card */}
          <div className="absolute bottom-6 left-4 right-4 z-40">
            <div
              className="rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center justify-between gap-4"
              style={{ backgroundColor: 'rgba(47,53,59,0.95)', backdropFilter: 'blur(16px)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/20 flex-shrink-0">
                  <img
                    src={PROVIDER_IMG}
                    alt="Marcos Zúñiga"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = '/images/user-avatar.png' }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3
                      className="font-bold text-base text-[--color-nieve]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Marcos Zúñiga
                    </h3>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#ffb4ab', animation: 'pulse 2s infinite' }}
                    />
                  </div>
                  <p className="text-xs text-[--color-muted]">Electricista · A 1.2 km</p>
                  <div className="flex items-center gap-1 mt-1">
                    <IconTimer />
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: '#3de273' }}
                    >
                      Llegada en 15 min
                    </span>
                  </div>
                </div>
              </div>
              <a
                href="tel:+5492944000010"
                className="flex flex-col items-center justify-center px-5 py-3 rounded-xl active:scale-95 transition-transform shadow-lg flex-shrink-0"
                style={{ backgroundColor: '#ffb4ab' }}
              >
                <IconPhone />
                <span className="text-[10px] uppercase font-bold mt-0.5" style={{ color: '#690005' }}>
                  Llamar
                </span>
              </a>
            </div>
          </div>

        </section>

        {/* ── ¿Sos prestador? ─────────────────────────────────────────────────── */}
        <section className="mt-4 px-6 mb-6">
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              backgroundColor: '#161c22',
              borderLeft: '4px solid #3de273',
            }}
          >
            <h2
              className="text-xl font-bold text-[--color-nieve] mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ¿Sos prestador?
            </h2>

            {/* Guardia toggle */}
            <div
              className="rounded-xl p-3 flex items-center justify-between mb-4 border border-[#414845]/20"
              style={{ backgroundColor: '#2f353b' }}
            >
              <div className="flex items-center gap-3">
                <IconBell color="#3de273" />
                <span className="font-bold text-sm text-[--color-nieve]">Activá tu modo guardia</span>
              </div>
              <button
                onClick={() => setGuardiaOn(v => !v)}
                className="w-10 h-5 rounded-full relative p-0.5 flex items-center transition-colors"
                style={{ backgroundColor: guardiaOn ? '#3de273' : '#1a2026' }}
                aria-pressed={guardiaOn}
              >
                <div
                  className="w-4 h-4 rounded-full transition-transform"
                  style={{
                    backgroundColor: guardiaOn ? '#003915' : '#8b928e',
                    transform: guardiaOn ? 'translateX(20px)' : 'translateX(0)',
                  }}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="py-3 rounded-lg font-bold text-xs text-[#9ab8d6] active:scale-95 transition-transform"
                style={{ backgroundColor: '#2b4963', fontFamily: 'var(--font-display)' }}
              >
                Iniciar Sesión
              </button>
              <button
                className="py-3 border rounded-lg font-bold text-xs text-[--color-nieve] active:scale-95 transition-transform"
                style={{ borderColor: '#414845', fontFamily: 'var(--font-display)' }}
              >
                Registrarme
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── Bottom Nav ──────────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-xl border-t border-white/5 flex justify-around items-center h-20 px-4"
        style={{ backgroundColor: 'rgba(14,20,25,0.90)' }}
      >
        <NavTab icon={<IconExplore />}    label="Explorar"  onClick={() => navigate('/')} />
        <NavTab icon={<IconEmergency />}  label="Urgencias" active />
        <NavTab icon={<IconChat />}       label="Mensajes" />
        <NavTab icon={<IconPerson />}     label="Perfil" />
      </nav>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
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
        'flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all active:scale-90 duration-150',
        active ? '' : 'text-[--color-muted] hover:text-[--color-bosque-lt]',
      )}
      style={active ? { color: '#ffb4ab', backgroundColor: 'rgba(255,180,171,0.1)' } : undefined}
    >
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">{label}</span>
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconBoltFilled({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" stroke="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconPlumbing() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function IconPlumbingFilled() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function IconGas() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 6-8 6-8 12a8 8 0 0 0 16 0c0-6-8-6-8-12z" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconTimer() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3de273" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#690005" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.75a16 16 0 0 0 8.34 8.34l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function IconBell({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M10.01 3.22L2.5 17A2 2 0 0 0 4.24 20h15.52A2 2 0 0 0 21.5 17L13.99 3.22a2.25 2.25 0 0 0-3.98 0z" opacity="0.2"/>
      <path d="M12 9v4m0 4h.01M10.01 3.22L2.5 17A2 2 0 0 0 4.24 20h15.52A2 2 0 0 0 21.5 17L13.99 3.22a2.25 2.25 0 0 0-3.98 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
