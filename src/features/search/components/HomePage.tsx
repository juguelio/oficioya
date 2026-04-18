import { useNavigate, Link } from 'react-router-dom'
import { ciudades, rubros } from '@/design-system/tokens'
import { useCityStore } from '@/features/search/store'
import { cn } from '@/shared/utils/cn'
import type { CiudadId, RubroId } from '@/design-system/tokens'

// ─── Local images (downloaded from Stitch) ───────────────────────────────────
const HERO_IMG = '/images/hero-lanin.png'


// ─── HomePage ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const ciudadId    = useCityStore(s => s.ciudadId)
  const setCiudad   = useCityStore(s => s.setCiudad)
  const clearCiudad = useCityStore(s => s.clearCiudad)
  const navigate    = useNavigate()

  const ciudadData = ciudades.find(c => c.id === ciudadId)

  function handleRubro(rubroId: RubroId) {
    if (!ciudadId) {
      // Scroll to city pills if no city is selected yet
      document.getElementById('city-pills')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    navigate(`/${ciudadId}/${rubroId}`)
  }

  function handleCitySelect(id: CiudadId) {
    setCiudad(id)
  }

  return (
    <div className="min-h-screen text-[--color-nieve]" style={{ backgroundColor: '#0e1419' }}>

      {/* ── TopAppBar ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl shadow-2xl shadow-black/40 flex items-center justify-between px-6 h-16" style={{ backgroundColor: 'rgba(14,20,25,0.75)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={clearCiudad}
            className="text-[--color-bosque-lt] hover:bg-[--color-sombra]/50 transition-colors active:scale-95 duration-200 p-2 rounded-xl"
            aria-label="Menú"
          >
            <IconMenu />
          </button>
          <span
            className="font-bold tracking-tighter text-xl text-[--color-nieve] cursor-pointer"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
            onClick={clearCiudad}
          >
            OFICIO
          </span>
        </div>

        <Link
          to="/planes"
          className="text-xs font-semibold text-[--color-muted] hover:text-[--color-nieve] transition-colors"
        >
          Soy prestador →
        </Link>
      </header>

      <main className="pt-16 pb-24">

        {/* ── Hero Section ──────────────────────────────────────────────────────── */}
        <section className="relative h-[400px] flex items-end px-6 pb-8 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src={HERO_IMG}
              alt="Volcán Lanín"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 20%' }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0e1419 0%, rgba(14,20,25,0.35) 50%, transparent 100%)' }} />
          </div>

          <div className="relative z-10 max-w-2xl">
            <h2
              className="text-4xl md:text-6xl font-black tracking-tight text-[--color-nieve] leading-none mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.03em',
                textShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              Manos expertas,<br />
              <span className="text-[--color-bosque-lt]">origen local.</span>
            </h2>
            <p className="text-[--color-muted] text-base max-w-md">
              Conectá con profesionales en el corredor andino patagónico.
            </p>
          </div>
        </section>

        {/* ── City Pills — always visible, inline ───────────────────────────────── */}
        <section id="city-pills" className="px-6 pt-5 pb-2">
          <p className="text-xs font-bold tracking-[0.15em] text-[--color-muted] uppercase mb-3">
            {ciudadId ? 'Ciudad seleccionada' : '¿Dónde estás?'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {ciudades.map(c => (
              <button
                key={c.id}
                onClick={() => handleCitySelect(c.id as CiudadId)}
                className={cn(
                  'px-4 py-2.5 rounded-[--radius-full] text-sm font-semibold whitespace-nowrap transition-all shrink-0',
                  'active:scale-95',
                  ciudadId === c.id
                    ? 'bg-[--color-bosque-lt] text-white shadow-lg shadow-[--color-bosque-lt]/20'
                    : 'bg-[--color-sombra] text-[--color-muted] border border-[#1E2E1E] hover:border-[--color-bosque-lt]/50 hover:text-[--color-nieve]',
                )}
              >
                {c.label}
              </button>
            ))}
            {ciudadId && (
              <button
                onClick={clearCiudad}
                className="px-3 py-2.5 rounded-[--radius-full] text-xs font-semibold whitespace-nowrap transition-all shrink-0 text-[--color-muted] hover:text-red-400 border border-[#1E2E1E] hover:border-red-500/40 active:scale-95"
                style={{ backgroundColor: '#1a2026' }}
                aria-label="Cambiar ciudad"
              >
                ×
              </button>
            )}
          </div>
        </section>

        {/* ── Emergency Banner ──────────────────────────────────────────────────── */}
        <section className="px-6 mt-6">
          <button
            onClick={() => navigate('/emergencias')}
            className="w-full flex items-center justify-between py-4 px-5 rounded-[--radius-lg] text-left transition-all duration-150 active:scale-[0.98] hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--color-sombra)',
              borderLeft: '3px solid #ffb4ab',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E2E1E' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-sombra)' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                style={{ backgroundColor: '#ffb4ab' }}
              />
              <div>
                <p
                  className="text-base font-bold text-[--color-nieve]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  ¿Es una urgencia?
                </p>
                <p className="text-xs text-[--color-muted] mt-0.5">
                  Conectate ya con alguien de guardia
                </p>
              </div>
            </div>
            <IconChevronRight />
          </button>
        </section>

        {/* ── Category Grid ─────────────────────────────────────────────────────── */}
        <section className="px-6 mt-6">
          <h3
            className="text-xl font-bold mb-5 flex items-center gap-2 text-[--color-nieve]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="w-2 h-6 bg-[--color-bosque-lt] rounded-full inline-block" />
            {ciudadId ? `Servicios en ${ciudadData?.label}` : 'Elegí un rubro'}
          </h3>

          {/* Top 4 rubros — large cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rubros.slice(0, 4).map(r => (
              <button
                key={r.id}
                onClick={() => handleRubro(r.id as RubroId)}
                className={cn(
                  'bg-[--color-sombra] rounded-[--radius-xl] p-5 text-left group',
                  'border border-[#1E2E1E] hover:border-[--color-bosque-lt]',
                  'hover:bg-[#1E2E1E] transition-all cursor-pointer hover:-translate-y-0.5',
                  'active:scale-[0.98]',
                  !ciudadId && 'opacity-60',
                )}
              >
                <div className="w-12 h-12 rounded-[--radius-lg] bg-[#2A3A2A] flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform leading-none">
                  {r.icon}
                </div>
                <span
                  className="font-bold text-base block text-[--color-nieve]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {r.label}
                </span>
                {ciudadId && (
                  <span className="text-xs text-[--color-bosque-lt] font-semibold mt-0.5 block">
                    {ciudadData?.label}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Rest of rubros — compact list */}
          <div className={cn('mt-4 grid grid-cols-2 md:grid-cols-3 gap-3', !ciudadId && 'opacity-60')}>
            {rubros.slice(4).map(r => (
              <button
                key={r.id}
                onClick={() => handleRubro(r.id as RubroId)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-[--radius-lg] text-left group',
                  'bg-[--color-sombra] border border-[#1E2E1E]',
                  'hover:border-[--color-bosque-lt] hover:bg-[#1E2E1E] hover:-translate-y-0.5',
                  'transition-all duration-150 active:scale-[0.98]',
                )}
              >
                <span className="text-2xl leading-none">{r.icon}</span>
                <span className="text-sm font-semibold text-[--color-nieve]">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Prompt when no city selected */}
          {!ciudadId && (
            <p className="text-xs text-[--color-muted] text-center mt-4">
              Elegí tu ciudad arriba para ver los prestadores disponibles
            </p>
          )}
        </section>

        {/* ── Para prestadores CTA ──────────────────────────────────────────────── */}
        <section className="px-6 mt-14">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs font-bold tracking-[0.15em] text-[--color-bosque-lt] uppercase mb-2">
                Para profesionales
              </p>
              <h3
                className="text-2xl font-bold text-[--color-nieve]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Sumá tu perfil
              </h3>
              <p className="text-sm text-[--color-muted] mt-1">
                Llegá a clientes verificados en tu zona
              </p>
            </div>
            <Link
              to="/planes"
              className="text-[--color-bosque-lt] text-xs font-bold uppercase tracking-widest border-b border-[--color-bosque-lt] pb-1 hover:opacity-80 transition-opacity shrink-0"
            >
              Ver planes
            </Link>
          </div>
        </section>

        {/* ── Provider Footer CTA ──────────────────────────────────────────────── */}
        <div
          className="mt-14 flex items-center justify-between px-6 py-5 border-t border-[#1E2E1E]"
          style={{ backgroundColor: 'var(--color-sombra)' }}
        >
          <div>
            <p className="text-sm font-bold text-[--color-nieve]">¿Sos prestador?</p>
            <p className="text-xs text-[--color-muted] mt-0.5">
              Sumáte a la red de oficios de la Patagonia.
            </p>
          </div>
          <Link
            to="/registro/prestador"
            className="px-4 py-2 rounded-[--radius-full] text-xs font-bold bg-[--color-bosque-lt] text-white active:scale-95 transition-all"
          >
            Registrate →
          </Link>
        </div>

      </main>

      {/* ── Bottom Nav ────────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-xl rounded-t-xl shadow-[0_-10px_40px_rgba(0,0,0,0.4)] flex justify-around items-center px-4 py-3"
        style={{ backgroundColor: 'rgba(14,20,25,0.75)' }}
      >
        <NavTab icon={<IconExplore />}   label="Explorar"  active />
        <button
          onClick={() => navigate('/emergencias')}
          className="flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all active:scale-90 duration-150"
          style={{ color: '#ffb4ab', backgroundColor: 'rgba(255,180,171,0.08)' }}
        >
          <IconEmergency />
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Urgencias</span>
        </button>
        <NavTab icon={<IconHandyman />} label="Reservas" />
        <Link
          to="/planes"
          className="flex flex-col items-center justify-center text-[--color-muted] px-4 py-2 hover:text-[--color-bosque-lt] transition-all active:scale-90 duration-150"
        >
          <IconPerson />
          <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">Prestador</span>
        </Link>
      </nav>

    </div>
  )
}

// ─── NavTab ───────────────────────────────────────────────────────────────────

type NavTabProps = {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}

function NavTab({ icon, label, active = false, onClick }: NavTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all active:scale-90 duration-150',
        active
          ? 'bg-[--color-sombra] text-[--color-bosque-lt]'
          : 'text-[--color-muted] hover:text-[--color-bosque-lt]',
      )}
    >
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">{label}</span>
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
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

function IconHandyman() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
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

function IconChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-[--color-muted] shrink-0"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

