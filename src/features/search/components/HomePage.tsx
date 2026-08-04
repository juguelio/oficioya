import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ciudades, rubros, radioOperativoV1 } from '@/design-system/tokens'
import { useCityStore } from '@/features/search/store'
// excepción documentada (§3): search consume el hook useProviders de la feature providers.
// El hook encapsula el fetch a Supabase (providers_public) — mover eso a shared/ sería un
// refactor grande. Se deja como dependencia cross-feature explícita, no se mueve.
import { useProviders } from '@/features/providers/hooks'
import { useAuth } from '@/hooks/useAuth'
import { useViewer } from '@/hooks/useViewer'
import { Logo, RubroIcon, Footer } from '@/shared/components'
import { formatARS } from '@/shared/utils/formatARS'
import { initials } from '@/shared/utils/initials'
import { BASE_PLAN } from '@/shared/config/plans'
import { rubroPhotos } from '@/shared/config/rubro-photos'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { Provider } from '@/shared/types'

const FALLBACK_PHOTO = '/images/user-avatar.png'
const MARKET_SCOPE_COPY = 'San Martín + Junín de los Andes'

// Rubros con keywords de búsqueda por problema (no solo por nombre de oficio)
const EMERGENCY_RUBROS: { id: RubroId; label: string; icon: string; keywords: string[] }[] = [
  { id: 'cerrajero',       label: 'Cerrajero',       icon: '🔑', keywords: ['llave', 'cerradura', 'puerta', 'entrada', 'candado', 'cerrado', 'bloqueado'] },
  { id: 'electricista',    label: 'Electricista',    icon: '⚡', keywords: ['luz', 'enchufe', 'cable', 'corte', 'electricidad', 'corriente', 'tablero', 'fusible', 'sin luz'] },
  { id: 'plomero',         label: 'Plomero',         icon: '🔧', keywords: ['caño', 'agua', 'perdida', 'pérdida', 'cañeria', 'canilla', 'inundación', 'goteo', 'baño', 'cocina'] },
  { id: 'gasista',         label: 'Gasista',         icon: '🔥', keywords: ['gas', 'garrafa', 'olor', 'fuga', 'caldera', 'termotanque', 'pérdida gas'] },
  { id: 'calefaccionista', label: 'Calefacción',     icon: '♨️', keywords: ['calefactor', 'estufa', 'caldera', 'calefaccion', 'frio', 'frío', 'radiador', 'leña', 'pellet'] },
  { id: 'techista',        label: 'Techista',        icon: '🏗️', keywords: ['techo', 'gotera', 'lluvia', 'teja', 'chapa', 'filtración', 'claraboya'] },
  { id: 'albanil',         label: 'Albañil',         icon: '🧱', keywords: ['pared', 'grieta', 'humedad', 'revoque', 'cemento', 'obra', 'refacción'] },
  { id: 'herrero',         label: 'Herrero',         icon: '⚙️', keywords: ['reja', 'puerta metálica', 'portón', 'herrería', 'soldadura', 'metal'] },
  { id: 'carpintero',      label: 'Carpintero',      icon: '🪚', keywords: ['madera', 'mueble', 'puerta madera', 'ventana', 'placard', 'deck', 'parquet'] },
  { id: 'tecnico-pc',      label: 'Técnico en PC',   icon: '💻', keywords: ['computadora', 'pc', 'notebook', 'virus', 'lento', 'internet', 'wifi', 'impresora'] },
  { id: 'pintor',          label: 'Pintor',           icon: '🖌️', keywords: ['pintura', 'pared', 'exterior', 'interior', 'barniz', 'enduido'] },
  { id: 'jardinero',       label: 'Jardinero',        icon: '🌿', keywords: ['pasto', 'jardín', 'poda', 'árbol', 'plantas', 'riego'] },
  { id: 'flete',           label: 'Flete / Mudanza',  icon: '🚛', keywords: ['mudanza', 'transporte', 'mover', 'carga', 'camión', 'traslado'] },
  { id: 'leniero',         label: 'Leñero',           icon: '🪵', keywords: ['leña', 'madera combustible', 'estufa a leña'] },
  { id: 'limpieza',        label: 'Limpieza',         icon: '🧹', keywords: ['limpiar', 'limpieza', 'mucama', 'empleada', 'orden'] },
  { id: 'cabanas',         label: 'Mant. de cabañas', icon: '🏕️', keywords: ['cabaña', 'alquiler', 'mantenimiento', 'temporada'] },
  { id: 'electrodomesticos', label: 'Electrodomésticos', icon: '🧊', keywords: ['heladera', 'freezer', 'lavarropas', 'secarropas', 'lavavajillas', 'microondas', 'cocina eléctrica', 'no enfría', 'no arranca', 'pierde agua', 'service', 'electrodoméstico'] },
]

// El carrusel muestra LOS 17 rubros. Antes había una lista de 10 "destacados" y los
// otros 7 (jardinero, herrero, techista, técnico en PC, flete, leñero, cabañas) sólo
// aparecían si el cliente los buscaba por nombre — o sea, casi nunca.

// ─── HomePage ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const ciudadId    = useCityStore(s => s.ciudadId)
  const setCiudad   = useCityStore(s => s.setCiudad)
  const clearCiudad = useCityStore(s => s.clearCiudad)
  const navigate    = useNavigate()

  const { user, loading: authLoading } = useAuth()
  const { role: viewerRole, loading: viewerLoading } = useViewer()

  const ciudadData = ciudades.find(c => c.id === ciudadId)
  const [emergencySearch, setEmergencySearch] = useState('')
  const [rubroSearch, setRubroSearch]         = useState('')
  const [showLoginSheet, setShowLoginSheet]   = useState(false)
  const isRubroSearching = rubroSearch.trim().length > 0

  const orderedCiudades = useMemo(
    () => ciudadId
      ? [ciudades.find(c => c.id === ciudadId)!, ...ciudades.filter(c => c.id !== ciudadId)]
      : [...ciudades],
    [ciudadId],
  )

  const { providers, loading: providersLoading } = useProviders(
    ciudadId ? { ciudad: ciudadId } : {},
  )

  const visibleCiudades = useMemo(
    () => orderedCiudades.filter(c => radioOperativoV1.includes(c.id)),
    [orderedCiudades],
  )

  // Se muestran también los perfiles sin reclamar: son negocios reales con rating de
  // Google y el contacto oculto hasta que el prestador confirma (CLAIMABLE-PROFILES.md).
  const publicProviders = providers

  const topProviders = useMemo<Provider[]>(
    () => publicProviders.slice(0, 8),
    [publicProviders],
  )

  const rubroCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const p of publicProviders) {
      counts[p.rubro] = (counts[p.rubro] ?? 0) + 1
    }
    return counts
  }, [publicProviders])

  // Con 17 rubros y oferta despareja, el orden fijo dejaba tarjetas vacías (grises)
  // adelante y rubros con 59 prestadores al final. Con ciudad elegida se ordena por
  // cantidad; sin ciudad no hay dato, así que queda el orden de tokens.ts.
  const rubrosOrdenados = useMemo(() => {
    if (!ciudadId) return rubros
    return [...rubros].sort((a, b) => (rubroCounts[b.id] ?? 0) - (rubroCounts[a.id] ?? 0))
  }, [ciudadId, rubroCounts])

  const filteredSearchRubros = useMemo(() => {
    const q = rubroSearch.toLowerCase().trim()
    if (!q) return []
    return rubros.filter(r => {
      const em = EMERGENCY_RUBROS.find(e => e.id === r.id)
      return (
        r.label.toLowerCase().includes(q) ||
        r.id.includes(q) ||
        (em?.keywords.some(k => k.includes(q)) ?? false)
      )
    })
  }, [rubroSearch])

  function handleRubro(rubroId: RubroId) {
    if (!ciudadId) {
      document.getElementById('city-section')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    navigate(`/${ciudadId}/${rubroId}`)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-noche)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 h-14 border-b"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <div className="px-5 h-full flex items-center justify-between">
          <button onClick={clearCiudad} className="active:scale-95 transition-transform" aria-label="Inicio">
            <Logo size={26} withWordmark />
          </button>
          {/* Con sesión iniciada el header mostraba igual "Ingresar / Registrate":
              el usuario entraba bien, volvía al home y concluía que no había entrado.
              Era la causa principal de que el login pareciera roto.
              Y con sesión mostraba SIEMPRE "Mi panel" → /dashboard, que es el panel
              del prestador: un cliente terminaba en el onboarding de alta. Ahora el
              destino depende de qué es la cuenta. */}
          <div className="flex items-center gap-2">
            {authLoading || viewerLoading ? (
              <div className="h-7 w-24 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-line)' }} />
            ) : user ? (
              <Link
                to={viewerRole === 'cliente' ? '/mis-trabajos' : '/dashboard'}
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors active:scale-95 text-white"
                style={{ backgroundColor: 'var(--color-bosque-lt)' }}
              >
                {viewerRole === 'cliente' ? 'Mis trabajos' : 'Mi panel'}
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginSheet(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors active:scale-95"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Ingresar
                </button>
                {/* Al selector de rol (/onboarding), NO directo al alta de prestador:
                    un cliente que toca "Registrate" no tiene que caer en el chat de
                    alta — en v1 el cliente ni siquiera necesita cuenta. */}
                <Link
                  to="/onboarding"
                  className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors active:scale-95 text-white"
                  style={{ backgroundColor: 'var(--color-bosque-lt)' }}
                >
                  Registrate
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-14 pb-24">

        {/* ── HERO ─────────────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: 'var(--color-bosque-lt)' }}>
          <div className="px-5 sm:px-10 lg:px-16 pt-8 pb-8">
          <h1
            className="text-white font-black leading-none mb-1"
            style={{ fontSize: 30, letterSpacing: '-0.03em' }}
          >
            Encontrá al profesional<br />que necesitás
          </h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Los oficios de la zona, en un solo lugar. Radio {MARKET_SCOPE_COPY}.
          </p>

          {/* Search bar grande */}
          <div className="relative">
            <div className="w-full flex items-center gap-3 bg-white rounded-lg px-4 py-3.5">
              <IconSearch />
              <input
                type="text"
                value={rubroSearch}
                onChange={e => setRubroSearch(e.target.value)}
                placeholder="¿Qué servicio necesitás?"
                className="text-sm flex-1 bg-transparent focus:outline-none min-w-0"
                style={{ color: 'var(--color-nieve)' }}
              />
              {rubroSearch ? (
                <button
                  onClick={() => setRubroSearch('')}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'var(--color-line)', color: 'var(--color-muted)' }}
                >
                  ×
                </button>
              ) : ciudadId ? (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                  style={{ color: 'var(--color-bosque-lt)', backgroundColor: 'var(--color-brand-tint)' }}
                >
                  {ciudadData?.label}
                </span>
              ) : (
                <button
                  onClick={() => document.getElementById('city-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0 text-white active:scale-95 transition-all"
                  style={{ backgroundColor: 'var(--color-bosque-lt)' }}
                >
                  Elegí ciudad
                </button>
              )}
            </div>

            {/* Dropdown resultados */}
            {isRubroSearching && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 rounded-lg overflow-hidden z-20 shadow-xl"
                style={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}
              >
                {filteredSearchRubros.length > 0
                  ? filteredSearchRubros.map(r => {
                      const count = ciudadId ? (rubroCounts[r.id] ?? 0) : null
                      return (
                        <button
                          key={r.id}
                          onClick={() => { handleRubro(r.id as RubroId); setRubroSearch('') }}
                          className="flex items-center gap-3 px-4 py-3 w-full text-left active:bg-gray-50 transition-colors border-b last:border-b-0"
                          style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                        >
                          <RubroIcon rubro={r.id as RubroId} size={22} style={{ color: 'var(--color-bosque-lt)' }} />
                          <span className="text-sm font-semibold flex-1" style={{ color: 'var(--color-nieve)' }}>
                            {r.label}
                          </span>
                          {count !== null && count > 0 && (
                            <span
                              className="text-xs font-black shrink-0 px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: 'var(--color-bosque-lt)', fontFamily: 'var(--font-mono)' }}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      )
                    })
                  : (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--color-muted)' }}>
                      Sin resultados para "{rubroSearch}"
                    </p>
                  )
                }
              </div>
            )}
          </div>
          </div>
        </section>

        {/* ── TRUST STRIP ──────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: 'var(--color-bosque-dk)' }}>
          <div className="flex divide-x" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          {[
            { stat: '90 días', label: 'Gratis para fundadores' },
            { stat: 'WhatsApp', label: 'Contacto directo' },
            { stat: '<40 km', label: 'Radio operativo' },
          ].map(({ stat, label }) => (
            <div key={label} className="flex-1 py-3 px-2 text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <p
                className="font-black text-base leading-none"
                style={{ color: 'var(--color-guardia)', fontFamily: 'var(--font-mono)' }}
              >
                {stat}
              </p>
              <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {label}
              </p>
            </div>
          ))}
          </div>
        </section>

        {/* ── CIUDAD ───────────────────────────────────────────────────────────── */}
        <section id="city-section">
          <div className="px-5 sm:px-10 lg:px-16 pt-5 pb-1">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>
            {ciudadId ? 'Tu ciudad' : '¿Dónde estás?'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {visibleCiudades.map(c => (
              <button
                key={c.id}
                onClick={() => setCiudad(c.id as CiudadId)}
                className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all shrink-0 border active:scale-95"
                style={
                  ciudadId === c.id
                    ? { backgroundColor: 'var(--color-bosque-lt)', borderColor: 'var(--color-bosque-lt)', color: '#fff' }
                    : { backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)', color: 'var(--color-muted)' }
                }
              >
                {c.label}
              </button>
            ))}
            {ciudadId && (
              <button
                onClick={clearCiudad}
                className="px-3 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap border active:scale-95"
                style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
              >
                ×
              </button>
            )}
            <span
              className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap border shrink-0"
              style={{ backgroundColor: 'var(--color-brand-tint)', borderColor: 'var(--color-line)', color: 'var(--color-bosque-dk)' }}
            >
              Junín de los Andes · sumando prestadores
            </span>
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Validamos un radio cercano: San Martín como núcleo y Junín como oferta útil si atiende la zona.
          </p>
          </div>
        </section>

        {/* ── URGENCIAS — zona oscura full-bleed ───────────────────────────────── */}
        <section className="mt-5" style={{ backgroundColor: 'var(--color-guardia-bg)' }}>
          <div className="px-5 sm:px-10 lg:px-16 pt-5 pb-4">

            {/* Label + link */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-emergency)' }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--color-emergency)' }}>
                  Urgencias 24/7
                </span>
              </div>
              <button onClick={() => navigate('/emergencias')} className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Ver mapa →
              </button>
            </div>

            <p className="font-black text-white mb-4" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>
              ¿Qué necesitás ahora?
            </p>

            {/* Search input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <IconSearch size={16} />
              </div>
              <input
                type="text"
                value={emergencySearch}
                onChange={e => setEmergencySearch(e.target.value)}
                placeholder="Ej: no hay luz, se rompió un caño..."
                className="w-full pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                }}
              />
            </div>
          </div>

          {/* CTA — separado del contenido, con línea arriba */}
          <div className="">
          <button
            onClick={() => navigate('/emergencias')}
            className="w-full flex items-center justify-between px-5 py-4 active:opacity-70 transition-opacity"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-emergency)' }}>
              <IconBolt />
              Ver todos los guardias disponibles
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-emergency)' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          </div>
        </section>

        {/* ── CATEGORÍAS ───────────────────────────────────────────────────────── */}
        <section className="pt-7">
          <div className="px-5 sm:px-10 lg:px-16 flex items-center justify-between mb-4">
            <h2 className="font-black text-lg" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
              {ciudadId ? `Servicios en ${ciudadData?.label}` : 'Servicios'}
            </h2>
            {!ciudadId && (
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Elegí una ciudad</span>
            )}
          </div>

          {/* Categorías — carrusel en mobile, grid en desktop */}
          <div className="relative">
          {/* Degradé de borde: avisa que el carrusel sigue. Solo mobile. */}
          <div
            className="pointer-events-none absolute top-0 right-0 bottom-2 w-10 z-10 sm:hidden"
            style={{ background: 'linear-gradient(to right, rgba(247,246,242,0), var(--color-noche))' }}
          />
          {/* 17 rubros: 9 columnas en lg dan dos filas parejas (9 + 8). Con menos
              columnas la tarjeta cuadrada se estira y el contenido queda perdido. */}
          <div className="flex gap-2.5 overflow-x-auto pl-5 pr-5 pb-2 scrollbar-hide snap-x sm:grid sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 sm:overflow-visible sm:px-10 lg:px-16 sm:gap-3">
            {rubrosOrdenados.map(r => {
              const count        = ciudadId ? (rubroCounts[r.id] ?? 0) : null
              const hasProviders = count === null || count > 0
              const photo        = rubroPhotos[r.id as RubroId]
              return (
                <button
                  key={r.id}
                  onClick={() => handleRubro(r.id as RubroId)}
                  className="snap-start shrink-0 w-[104px] sm:w-full relative flex flex-col rounded-xl border overflow-hidden text-left active:scale-[0.97] transition-all"
                  style={{
                    backgroundColor: 'var(--color-sombra)',
                    borderColor: 'var(--color-line)',
                    opacity: hasProviders ? 1 : 0.45,
                  }}
                >
                  {count !== null && count > 0 && (
                    <span
                      className="absolute top-2 right-2 z-10 text-[10px] font-black leading-none px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-bosque-lt)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                    >
                      {count}
                    </span>
                  )}
                  {/* Foto del oficio; si todavía no hay, cae al icono sobre el tint de marca. */}
                  <div
                    className="w-full aspect-square flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-brand-tint)' }}
                  >
                    {photo
                      ? <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                      : <RubroIcon
                          rubro={r.id as RubroId}
                          size={30}
                          /* proporcional a la tarjeta: con size fijo el icono se
                             pierde apenas la tarjeta crece */
                          className="w-[42%] h-[42%]"
                          style={{ color: 'var(--color-bosque-lt)' }}
                        />}
                  </div>
                  <span className="text-[11px] font-semibold leading-tight px-2 py-2.5" style={{ color: 'var(--color-nieve)' }}>
                    {r.label}
                  </span>
                </button>
              )
            })}
          </div>
          </div>

          {/* Search box — otros servicios / por descripción del problema */}
          <div className="px-5 sm:px-10 lg:px-16 mt-5">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <IconSearch size={17} />
              </div>
              <input
                type="text"
                value={rubroSearch}
                onChange={e => setRubroSearch(e.target.value)}
                placeholder="Ej: caño roto, sin luz, mudanza..."
                className="w-full pl-11 pr-10 py-3.5 rounded-lg text-sm focus:outline-none placeholder:text-[var(--color-muted)]"
                style={{
                  backgroundColor: 'var(--color-sombra)',
                  border: '1px solid var(--color-line)',
                  color: 'var(--color-nieve)',
                }}
              />
              {rubroSearch && (
                <button
                  onClick={() => setRubroSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold leading-none active:scale-90 transition-all"
                  style={{ backgroundColor: 'var(--color-line)', color: 'var(--color-muted)' }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Sugerencias vivas — aparecen solo al tipear */}
            {isRubroSearching && (
              <div className="mt-2 space-y-1">
                {filteredSearchRubros.length > 0
                  ? filteredSearchRubros.map(r => {
                      const count        = ciudadId ? (rubroCounts[r.id] ?? 0) : null
                      const hasProviders = count === null || count > 0
                      return (
                        <button
                          key={r.id}
                          onClick={() => { handleRubro(r.id as RubroId); setRubroSearch('') }}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-lg border w-full text-left active:scale-[0.98] transition-all"
                          style={{
                            backgroundColor: 'var(--color-sombra)',
                            borderColor: 'var(--color-line)',
                            opacity: hasProviders ? 1 : 0.5,
                          }}
                        >
                          <RubroIcon rubro={r.id as RubroId} size={24} style={{ color: 'var(--color-bosque-lt)' }} />
                          <span className="text-sm font-semibold flex-1" style={{ color: 'var(--color-nieve)' }}>
                            {r.label}
                          </span>
                          {count !== null && count > 0 && (
                            <span
                              className="text-xs font-black shrink-0 px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: 'var(--color-bosque-lt)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                            >
                              {count}
                            </span>
                          )}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      )
                    })
                  : (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--color-muted)' }}>
                      Sin resultados para "{rubroSearch}"
                    </p>
                  )
                }
              </div>
            )}
          </div>

          {!ciudadId && !isRubroSearching && (
            <p className="text-xs text-center mt-3 px-5" style={{ color: 'var(--color-muted)' }}>
              Elegí tu ciudad para ver disponibilidad
            </p>
          )}
        </section>

        {/* ── PUBLICÁ TU TRABAJO ───────────────────────────────────────────────── */}
        {/* El cliente postea SIN cuenta (anónimo + token, /trabajos/nuevo): la
            feature ya existía pero era invisible desde la home. */}
        <section className="pt-8">
          <div className="px-5 sm:px-10 lg:px-16">
            <div
              className="rounded-xl border p-5 sm:flex sm:items-center sm:justify-between sm:gap-6"
              style={{ backgroundColor: 'var(--color-brand-tint)', borderColor: 'var(--color-bosque-lt)' }}
            >
              <div className="mb-4 sm:mb-0">
                <h2 className="font-black text-lg mb-1" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
                  ¿Preferís que te contacten ellos?
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  Contá qué necesitás y recibí presupuestos de la zona. Sin cuenta: seguís las respuestas con un link.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <button
                  onClick={() => navigate('/trabajos/nuevo')}
                  className="px-5 py-3 rounded-full font-bold text-sm text-white active:scale-[0.98] transition-all"
                  style={{ backgroundColor: 'var(--color-bosque-lt)' }}
                >
                  Publicar un trabajo
                </button>
                <button
                  onClick={() => navigate('/trabajos')}
                  className="text-sm font-bold"
                  style={{ color: 'var(--color-bosque-lt)' }}
                >
                  Ver trabajos
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── TOP PRESTADORES ──────────────────────────────────────────────────── */}
        {ciudadId && (providersLoading || topProviders.length > 0) && (
          <section className="pt-8">
            <div className="px-5 sm:px-10 lg:px-16 flex items-end justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-muted)' }}>
                  Cerca tuyo
                </p>
                <h2 className="font-black text-lg" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
                  Top en {ciudadData?.label}
                </h2>
              </div>
              <span
                className="text-xs font-bold"
                style={{ color: 'var(--color-bosque-lt)', fontFamily: 'var(--font-mono)' }}
              >
                {providersLoading ? '—' : `${publicProviders.length} en la zona`}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pl-5 pr-5 pb-2 scrollbar-hide snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-10 lg:px-16 sm:gap-4">
              {providersLoading
                ? Array.from({ length: 4 }).map((_, i) => <ProviderMiniCardSkeleton key={i} />)
                : topProviders.map(p => <ProviderMiniCard key={p.id} provider={p} />)
              }
            </div>
          </section>
        )}

        {/* ── WHY TRUST ────────────────────────────────────────────────────────── */}
        <section>
          <div className="px-5 pt-8">
          <h2 className="font-black text-lg mb-4" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
            ¿Por qué Oficio?
          </h2>
          <div className="space-y-3">
            {[
              { icon: '✓', title: 'Verificación con insignia', body: 'Los prestadores que confirman su perfil y presentan matrícula o DNI llevan la insignia ✓.' },
              // No prometer que las reseñas están restringidas a clientes verificados:
              // `submit_review` acepta envíos anónimos (v1 no tiene cuentas de cliente).
              { icon: '★', title: 'Reseñas de vecinos', body: 'Cualquier vecino que lo contrató puede dejar su opinión, y se publica con nombre.' },
              { icon: '📍', title: 'Hiperlocal', body: 'Solo el radio San Martín + Junín de los Andes. Gente que llega a tu casa el mismo día.' },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="flex gap-4 p-4 rounded-lg border"
                style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0 font-bold"
                  style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-lt)' }}
                >
                  {icon}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--color-nieve)' }}>{title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* ── CTA PRESTADORES ──────────────────────────────────────────────────── */}
        <section>
          <div className="px-5 pt-8">
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Para profesionales
            </p>
            <h2 className="font-black text-xl text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
              Sumá tu perfil
            </h2>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Sumate a la cohorte fundadora de {MARKET_SCOPE_COPY}. Gratis durante el lanzamiento; después desde{' '}
              <span className="font-bold text-white">{formatARS(BASE_PLAN.priceARS)}/mes</span>.
            </p>
            <div className="flex gap-2">
              <Link
                to="/registro/prestador"
                className="flex-1 text-center py-3 rounded-lg font-bold text-sm active:scale-95 transition-all"
                style={{ backgroundColor: 'var(--color-guardia)', color: 'var(--color-guardia-bg)' }}
              >
                Registrate gratis
              </Link>
              <Link
                to="/planes"
                className="px-4 py-3 rounded-lg font-bold text-sm border active:scale-95 transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.85)' }}
              >
                Ver planes
              </Link>
            </div>
          </div>
          </div>
        </section>

      </main>

      {/* pb-20 en mobile: el bottom nav fijo tapaba el copyright del footer */}
      <Footer className="pb-20 sm:pb-0" />

      {/* ── Login Sheet ────────────────────────────────────────────────────────── */}
      {showLoginSheet && (
        <div
          className="fixed inset-0 z-[200] flex flex-col justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowLoginSheet(false)}
        >
          <div
            className="rounded-t-2xl px-5 pt-4 pb-10"
            style={{ backgroundColor: 'var(--color-sombra)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* drag handle */}
            <div
              className="w-10 h-1 rounded-full mx-auto mb-5"
              style={{ backgroundColor: 'var(--color-line)' }}
            />
            <h3
              className="font-black text-xl mb-1"
              style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}
            >
              ¿Cómo querés ingresar?
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
              Elegí tu perfil para continuar
            </p>
            <div className="space-y-3">
              {/* Cliente: publicar sigue sin cuenta obligatoria. Crear cuenta es
                  opcional y sirve para conservar trabajos y presupuestos. */}
              <button
                onClick={() => { navigate('/registro/cliente'); setShowLoginSheet(false) }}
                className="w-full flex items-center gap-4 p-4 rounded-lg border text-left active:scale-[0.98] transition-all"
                style={{ backgroundColor: 'var(--color-noche)', borderColor: 'var(--color-line)' }}
              >
                <span
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: 'var(--color-brand-tint)' }}
                >
                  🏠
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--color-nieve)' }}>
                    Soy cliente
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Publicá sin cuenta o ingresá para seguir todos tus presupuestos
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              {/* Prestador — tocó "Ingresar", quiere loguearse: al login directo
                  (antes iba a /onboarding, la pantalla de presentación). */}
              <button
                onClick={() => { navigate('/login'); setShowLoginSheet(false) }}
                className="w-full flex items-center gap-4 p-4 rounded-lg border text-left active:scale-[0.98] transition-all"
                style={{ backgroundColor: 'var(--color-noche)', borderColor: 'var(--color-bosque-lt)' }}
              >
                <span
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: 'var(--color-brand-tint)' }}
                >
                  🔧
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--color-nieve)' }}>
                    Soy prestador
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Entrá a tu panel para gestionar tu perfil y contactos
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-bosque-lt)', flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 border-t sm:hidden"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <NavTab icon={<IconExplore />} label="Explorar" active />
        <button
          onClick={() => navigate('/emergencias')}
          className="flex flex-col items-center gap-1 active:scale-90 transition-all"
        >
          <span
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--color-emergency)', color: '#fff' }}
          >
            <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />
            Urgencias
          </span>
        </button>
        <Link
          to="/trabajos"
          className="flex flex-col items-center gap-1 active:scale-90 transition-all"
          style={{ color: 'var(--color-muted)' }}
        >
          <IconClipboard />
          <span className="text-[10px] font-semibold uppercase tracking-widest">Trabajos</span>
        </Link>
        <Link
          to="/registro/prestador"
          className="flex flex-col items-center gap-1 active:scale-90 transition-all"
          style={{ color: 'var(--color-muted)' }}
        >
          <IconBriefcase />
          <span className="text-[10px] font-semibold uppercase tracking-widest">Sumate</span>
        </Link>
        <Link
          to="/login"
          className="flex flex-col items-center gap-1 active:scale-90 transition-all"
          style={{ color: 'var(--color-muted)' }}
        >
          <IconPerson />
          <span className="text-[10px] font-semibold uppercase tracking-widest">Ingresar</span>
        </Link>
      </nav>

    </div>
  )
}

// ─── ProviderMiniCard ─────────────────────────────────────────────────────────

type ProviderMiniCardProps = { provider: Provider }

function ProviderMiniCard({ provider }: ProviderMiniCardProps) {
  const navigate = useNavigate()
  const ownPhoto = provider.photos?.[0]
  const photo    = ownPhoto ?? FALLBACK_PHOTO

  return (
    <button
      onClick={() => navigate(`/prestador/${provider.id}`)}
      className="snap-start shrink-0 w-36 sm:w-full text-left active:scale-[0.98] transition-transform"
    >
      <div
        className="relative aspect-square w-36 sm:w-full rounded-lg overflow-hidden border"
        style={{ borderColor: 'var(--color-line)' }}
      >
        {ownPhoto ? (
          <img
            src={photo}
            alt={provider.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center top' }}
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_PHOTO }}
          />
        ) : (
          /* Sin foto propia el nombre es la imagen: una ilustración de stock repetida
             en cientos de fichas se lee como relleno. */
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-brand-tint)' }}
          >
            <span
              className="leading-none select-none"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                letterSpacing: '-0.03em',
                color: 'var(--color-bosque-lt)',
              }}
            >
              {initials(provider.name)}
            </span>
          </div>
        )}
        {provider.subscription === 'destacado' && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: '#E8A020', color: '#fff' }}
          >
            Destacado
          </div>
        )}
        {provider.isVerified && provider.subscription !== 'destacado' && (
          <div
            className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: 'var(--color-bosque-lt)', borderColor: 'var(--color-bosque-lt)' }}
          >
            ✓
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm font-bold truncate" style={{ color: 'var(--color-nieve)' }}>
          {provider.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
          {/* Nunca "★ 0.0": rating Oficio si es real, si no la señal externa (Google), si no sólo el rubro */}
          {provider.claimed && provider.rating > 0 ? (
            <>
              <span style={{ color: 'var(--color-amber)' }}>★</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {provider.rating.toFixed(1)}
              </span>
              <span className="opacity-40">·</span>
            </>
          ) : provider.externalRating ? (
            <>
              <span style={{ color: 'var(--color-amber)' }}>★</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {provider.externalRating.toFixed(1)}
              </span>
              <span className="opacity-40">·</span>
            </>
          ) : null}
          <span className="capitalize truncate">{provider.rubro.replace('-', ' ')}</span>
        </div>
      </div>
    </button>
  )
}

// ─── ProviderMiniCardSkeleton ─────────────────────────────────────────────────

function ProviderMiniCardSkeleton() {
  return (
    <div className="snap-start shrink-0 w-36">
      <div
        className="aspect-square w-36 rounded-lg animate-pulse"
        style={{ backgroundColor: 'var(--color-sombra)' }}
      />
      <div className="mt-2 space-y-1.5">
        <div className="h-3.5 w-28 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-sombra)' }} />
        <div className="h-3 w-20 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-sombra)' }} />
      </div>
    </div>
  )
}

// ─── NavTab ───────────────────────────────────────────────────────────────────

type NavTabProps = { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }

function NavTab({ icon, label, active = false, onClick }: NavTabProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all active:scale-90"
      style={{ color: active ? 'var(--color-bosque-lt)' : 'var(--color-muted)' }}
    >
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSearch({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function IconBolt() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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

function IconBriefcase() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
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

function IconClipboard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}
