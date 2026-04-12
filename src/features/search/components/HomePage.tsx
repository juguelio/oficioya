import { useNavigate, Link } from 'react-router-dom'
import { ciudades, rubros } from '@/design-system/tokens'
import { useCityStore } from '@/features/search/store'
import { cn } from '@/shared/utils/cn'
import type { CiudadId, RubroId } from '@/design-system/tokens'

// ─── Local images (downloaded from Stitch) ───────────────────────────────────
const HERO_IMG            = '/images/hero-lanin.png'
const IMG_PROVIDER_ELEC   = '/images/provider-electricista.png'
const IMG_PROVIDER_CARP   = '/images/provider-carpintera.png'
const IMG_PROVIDER_JARD   = '/images/provider-jardinero.png'


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

        {/* ── Profesionales Destacados ──────────────────────────────────────────── */}
        <section className="px-6 mt-14">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3
                className="text-2xl font-bold text-[--color-nieve]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Profesionales Destacados
              </h3>
              <p className="text-sm text-[--color-muted]">Los mejor calificados en tu zona</p>
            </div>
            <button
              onClick={() => ciudadId ? navigate(`/${ciudadId}/electricista`) : undefined}
              className={cn(
                'text-[--color-bosque-lt] text-xs font-bold uppercase tracking-widest border-b border-[--color-bosque-lt] pb-1 hover:opacity-80 transition-opacity',
                !ciudadId && 'opacity-40 cursor-not-allowed',
              )}
            >
              Ver todos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeaturedCard
              img={IMG_PROVIDER_ELEC}
              name="Mateo Fernández"
              rubro="Electricista"
              ciudad="Bariloche"
              rating={4.9}
              phone="+5492944000001"
              bio="Especialista en instalaciones smart home y sistemas solares off-grid para cabañas de montaña."
            />
            <FeaturedCard
              img={IMG_PROVIDER_CARP}
              name="Sofía Lagos"
              rubro="Carpintera"
              ciudad="San Martín de los Andes"
              rating={5.0}
              phone="+5492972000002"
              bio="Especializada en muebles artesanales de lenga y técnicas de construcción alpina tradicional."
            />
            <div className="hidden lg:block">
              <FeaturedCard
                img={IMG_PROVIDER_JARD}
                name="Lucas Nahuel"
                rubro="Jardinero"
                ciudad="Villa La Angostura"
                rating={4.8}
                phone="+5492944000003"
                bio="Diseño de jardines sustentables con especies nativas patagónicas adaptadas al clima andino."
              />
            </div>
          </div>
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

// ─── FeaturedCard ─────────────────────────────────────────────────────────────

type FeaturedCardProps = {
  img: string
  name: string
  rubro: string
  ciudad: string
  rating: number
  phone: string
  bio: string
  className?: string
}

function FeaturedCard({ img, name, rubro, ciudad, rating, phone, bio, className }: FeaturedCardProps) {
  const waLink = `https://wa.me/${phone.replace(/\D/g, '')}`
  return (
    <article className={cn('rounded-[--radius-xl] overflow-hidden group', className)} style={{ backgroundColor: '#1a2026' }}>
      <div className="relative h-56">
        <img
          src={img}
          alt={rubro}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ objectPosition: 'center top' }}
        />
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: 'rgba(47,53,59,0.9)', backdropFilter: 'blur(8px)' }}>
          <span className="text-[--color-bosque-lt] text-sm">★</span>
          <span className="text-xs font-bold text-[--color-nieve]">{rating.toFixed(1)}</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-lg text-[--color-nieve]" style={{ fontFamily: 'var(--font-display)' }}>
            {name}
          </h4>
          <span className="text-xs font-semibold text-[--color-muted] bg-[#2A3A2A] px-2 py-1 rounded-full">{rubro}</span>
        </div>
        <p className="text-sm text-[--color-muted] mb-3">{ciudad}</p>
        <p className="text-sm text-[--color-nieve]/80 line-clamp-2 mb-5">{bio}</p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-[--radius-full] flex items-center justify-center gap-2 font-bold text-sm text-white active:scale-95 transition-all shadow-lg"
          style={{ background: '#25D366' }}
        >
          <IconWhatsApp />
          Contactar por WhatsApp
        </a>
      </div>
    </article>
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

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}
