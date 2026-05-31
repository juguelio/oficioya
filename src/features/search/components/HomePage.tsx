import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ciudades, rubros } from '@/design-system/tokens'
import { useCityStore } from '@/features/search/store'
import { useProviders, useGuardiaCount } from '@/features/providers/hooks'
import { Logo } from '@/shared/components'
import { cn } from '@/shared/utils/cn'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { Provider } from '@/features/providers/types'

const FALLBACK_PHOTO = '/images/user-avatar.png'

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
]

// Rubros principales — aparecen en el carrusel destacado
const FEATURED_RUBRO_IDS = new Set<RubroId>([
  'electricista', 'plomero', 'gasista', 'calefaccionista',
  'cerrajero', 'carpintero', 'albanil', 'pintor',
])
const FEATURED_RUBROS = rubros.filter(r => FEATURED_RUBRO_IDS.has(r.id as RubroId))

// ─── HomePage ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const ciudadId    = useCityStore(s => s.ciudadId)
  const setCiudad   = useCityStore(s => s.setCiudad)
  const clearCiudad = useCityStore(s => s.clearCiudad)
  const navigate    = useNavigate()

  const ciudadData = ciudades.find(c => c.id === ciudadId)
  const [emergencyRubro, setEmergencyRubro] = useState<RubroId | null>(null)
  const [emergencySearch, setEmergencySearch] = useState('')
  const [rubroSearch, setRubroSearch]         = useState('')
  const [showLoginSheet, setShowLoginSheet]   = useState(false)
  const isRubroSearching = rubroSearch.trim().length > 0

  const filteredEmergencyRubros = useMemo(() => {
    const q = emergencySearch.toLowerCase().trim()
    if (!q) return EMERGENCY_RUBROS.slice(0, 4)
    return EMERGENCY_RUBROS.filter(r =>
      r.label.toLowerCase().includes(q) ||
      r.id.includes(q) ||
      r.keywords.some(k => k.includes(q))
    ).slice(0, 5)
  }, [emergencySearch])

  const orderedCiudades = useMemo(
    () => ciudadId
      ? [ciudades.find(c => c.id === ciudadId)!, ...ciudades.filter(c => c.id !== ciudadId)]
      : [...ciudades],
    [ciudadId],
  )

  const { providers, loading: providersLoading } = useProviders(
    ciudadId ? { ciudad: ciudadId } : {},
  )
  const guardiaCounts = useGuardiaCount(ciudadId)

  const topProviders = useMemo<Provider[]>(
    () => providers.slice(0, 8),
    [providers],
  )

  const rubroCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const p of providers) {
      counts[p.rubro] = (counts[p.rubro] ?? 0) + 1
    }
    return counts
  }, [providers])

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
        className="fixed top-0 w-full z-50 flex items-center justify-between px-5 h-14 border-b"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <button onClick={clearCiudad} className="active:scale-95 transition-transform" aria-label="Inicio">
          <Logo size={26} withWordmark />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLoginSheet(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors active:scale-95"
            style={{ color: 'var(--color-muted)' }}
          >
            Ingresar
          </button>
          <Link
            to="/registro/prestador"
            className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors active:scale-95 text-white"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
            Registrate
          </Link>
        </div>
      </header>

      <main className="pt-14 pb-24">

        {/* ── HERO ─────────────────────────────────────────────────────────────── */}
        <section
          className="px-5 pt-8 pb-8"
          style={{ backgroundColor: 'var(--color-bosque-lt)' }}
        >
          <h1
            className="text-white font-black leading-none mb-1"
            style={{ fontSize: 30, letterSpacing: '-0.03em' }}
          >
            Encontrá al profesional<br />que necesitás
          </h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Verificados en San Martín, La Angostura y Bariloche.
          </p>

          {/* Search bar grande */}
          <div className="relative">
            <div className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3.5">
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
                className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-20 shadow-xl"
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
                          <span className="text-xl leading-none shrink-0">{r.icon}</span>
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
        </section>

        {/* ── TRUST STRIP ──────────────────────────────────────────────────────── */}
        <section
          className="flex divide-x"
          style={{ backgroundColor: '#174F77', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {[
            { stat: '100%', label: 'Prestadores verificados' },
            { stat: '24/7', label: 'Guardias disponibles' },
            { stat: '3', label: 'Ciudades del corredor' },
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
        </section>

        {/* ── CIUDAD ───────────────────────────────────────────────────────────── */}
        <section id="city-section" className="px-5 pt-5 pb-1">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>
            {ciudadId ? 'Tu ciudad' : '¿Dónde estás?'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {orderedCiudades.map(c => (
              <button
                key={c.id}
                onClick={() => setCiudad(c.id as CiudadId)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 border active:scale-95"
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
                className="px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap border active:scale-95"
                style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
              >
                ×
              </button>
            )}
          </div>
        </section>

        {/* ── URGENCIAS — zona oscura full-bleed ───────────────────────────────── */}
        <section className="mt-5" style={{ backgroundColor: 'var(--color-guardia-bg)' }}>
          <div className="px-5 pt-5 pb-4">

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

            {/* Search input — styling oscuro */}
            {emergencyRubro ? (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl mb-3"
                style={{ backgroundColor: 'rgba(255,79,59,0.15)', border: '1px solid rgba(255,79,59,0.4)' }}
              >
                <span className="text-sm font-bold flex items-center gap-2 text-white">
                  <span>{EMERGENCY_RUBROS.find(r => r.id === emergencyRubro)?.icon}</span>
                  {EMERGENCY_RUBROS.find(r => r.id === emergencyRubro)?.label}
                  {ciudadId && (guardiaCounts[emergencyRubro] ?? 0) > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-black text-white" style={{ backgroundColor: 'var(--color-emergency)' }}>
                      {guardiaCounts[emergencyRubro]}
                    </span>
                  )}
                </span>
                <button onClick={() => setEmergencyRubro(null)} className="text-lg leading-none font-bold ml-2" style={{ color: 'rgba(255,255,255,0.5)' }}>×</button>
              </div>
            ) : (
              <div className="relative mb-3">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IconSearch size={16} />
                </div>
                <input
                  type="text"
                  value={emergencySearch}
                  onChange={e => setEmergencySearch(e.target.value)}
                  placeholder="Ej: no hay luz, se rompió un caño..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                  }}
                />
              </div>
            )}

            {/* Sugerencias en la zona oscura */}
            {!emergencyRubro && (
              <div className={cn(emergencySearch ? 'space-y-1.5' : 'grid grid-cols-2 gap-2')}>
                {filteredEmergencyRubros.map(r => {
                  const count = ciudadId ? (guardiaCounts[r.id] ?? 0) : null
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setEmergencyRubro(r.id); setEmergencySearch('') }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left active:scale-[0.98] transition-all w-full"
                      style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
                    >
                      <span className="text-lg leading-none shrink-0">{r.icon}</span>
                      <span className="text-xs font-semibold flex-1">{r.label}</span>
                      {count !== null && count > 0 && (
                        <span className="text-xs font-black shrink-0" style={{ color: 'var(--color-emergency)' }}>{count}</span>
                      )}
                    </button>
                  )
                })}
                {emergencySearch && filteredEmergencyRubros.length === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Sin resultados para "{emergencySearch}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* CTA — separado del contenido, con línea arriba */}
          <button
            onClick={() => navigate('/emergencias')}
            className="w-full flex items-center justify-between px-5 py-4 active:opacity-70 transition-opacity"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-emergency)' }}>
              <IconBolt />
              {emergencyRubro && ciudadId
                ? (() => {
                    const c = guardiaCounts[emergencyRubro] ?? 0
                    const lbl = EMERGENCY_RUBROS.find(r => r.id === emergencyRubro)?.label ?? ''
                    return c > 0 ? `Ver ${c} guardia${c !== 1 ? 's' : ''} de ${lbl.toLowerCase()}` : `Sin guardias de ${lbl.toLowerCase()} ahora`
                  })()
                : 'Ver todos los guardias disponibles'
              }
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-emergency)' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </section>

        {/* ── CATEGORÍAS ───────────────────────────────────────────────────────── */}
        <section className="pt-7">
          <div className="flex items-center justify-between mb-4 px-5">
            <h2 className="font-black text-lg" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
              {ciudadId ? `Servicios en ${ciudadData?.label}` : 'Servicios'}
            </h2>
            {!ciudadId && (
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Elegí una ciudad</span>
            )}
          </div>

          {/* Carrusel — rubros principales */}
          <div className="flex gap-2.5 overflow-x-auto pl-5 pb-2 scrollbar-hide snap-x">
            {FEATURED_RUBROS.map(r => {
              const count        = ciudadId ? (rubroCounts[r.id] ?? 0) : null
              const hasProviders = count === null || count > 0
              return (
                <button
                  key={r.id}
                  onClick={() => handleRubro(r.id as RubroId)}
                  className="snap-start shrink-0 relative flex flex-col items-center gap-2 pt-5 pb-4 px-2 rounded-2xl border text-center active:scale-[0.97] transition-all"
                  style={{
                    width: 76,
                    backgroundColor: 'var(--color-sombra)',
                    borderColor: 'var(--color-line)',
                    opacity: hasProviders ? 1 : 0.45,
                  }}
                >
                  {count !== null && count > 0 && (
                    <span
                      className="absolute top-2 right-2 text-[10px] font-black leading-none px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-bosque-lt)', color: '#fff', fontFamily: 'var(--font-mono)' }}
                    >
                      {count}
                    </span>
                  )}
                  <span className="text-[28px] leading-none">{r.icon}</span>
                  <span className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--color-nieve)' }}>
                    {r.label}
                  </span>
                </button>
              )
            })}
            <div className="shrink-0 w-5" aria-hidden="true" />
          </div>

          {/* Search box — otros servicios / por descripción del problema */}
          <div className="px-5 mt-5">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <IconSearch size={17} />
              </div>
              <input
                type="text"
                value={rubroSearch}
                onChange={e => setRubroSearch(e.target.value)}
                placeholder="Ej: caño roto, sin luz, mudanza..."
                className="w-full pl-11 pr-10 py-3.5 rounded-xl text-sm focus:outline-none placeholder:text-[var(--color-muted)]"
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
                          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border w-full text-left active:scale-[0.98] transition-all"
                          style={{
                            backgroundColor: 'var(--color-sombra)',
                            borderColor: 'var(--color-line)',
                            opacity: hasProviders ? 1 : 0.5,
                          }}
                        >
                          <span className="text-2xl leading-none shrink-0">{r.icon}</span>
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

        {/* ── TOP PRESTADORES ──────────────────────────────────────────────────── */}
        {ciudadId && (providersLoading || topProviders.length > 0) && (
          <section className="pt-8">
            <div className="flex items-end justify-between px-5 mb-4">
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
                {providersLoading ? '—' : `${providers.length} activos`}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pl-5 pb-2 scrollbar-hide snap-x snap-mandatory">
              {providersLoading
                ? Array.from({ length: 4 }).map((_, i) => <ProviderMiniCardSkeleton key={i} />)
                : topProviders.map(p => <ProviderMiniCard key={p.id} provider={p} />)
              }
              <div className="shrink-0 w-5" aria-hidden="true" />
            </div>
          </section>
        )}

        {/* ── WHY TRUST ────────────────────────────────────────────────────────── */}
        <section className="px-5 pt-8">
          <h2 className="font-black text-lg mb-4" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
            ¿Por qué Oficio?
          </h2>
          <div className="space-y-3">
            {[
              { icon: '✓', title: 'Prestadores verificados', body: 'Cada prestador pasa por un proceso de verificación antes de aparecer en la plataforma.' },
              { icon: '★', title: 'Reseñas reales', body: 'Solo clientes que contrataron el servicio pueden dejar su opinión.' },
              { icon: '🔴', title: 'Guardias 24/7', body: 'Para urgencias reales. Alguien disponible en minutos, cualquier día.' },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="flex gap-4 p-4 rounded-xl border"
                style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 font-bold"
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
        </section>

        {/* ── CTA PRESTADORES ──────────────────────────────────────────────────── */}
        <section className="px-5 pt-8">
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Para profesionales
            </p>
            <h2 className="font-black text-xl text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
              Sumá tu perfil
            </h2>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Llegá a clientes verificados en tu zona. Desde {' '}
              <span className="font-bold text-white">$20.000/mes</span>.
            </p>
            <div className="flex gap-2">
              <Link
                to="/registro/prestador"
                className="flex-1 text-center py-3 rounded-xl font-bold text-sm active:scale-95 transition-all"
                style={{ backgroundColor: 'var(--color-guardia)', color: 'var(--color-guardia-bg)' }}
              >
                Registrate gratis
              </Link>
              <Link
                to="/planes"
                className="px-4 py-3 rounded-xl font-bold text-sm border active:scale-95 transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.85)' }}
              >
                Ver planes
              </Link>
            </div>
          </div>
        </section>

      </main>

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
              {/* Cliente */}
              <button
                onClick={() => { navigate('/login'); setShowLoginSheet(false) }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border text-left active:scale-[0.98] transition-all"
                style={{ backgroundColor: 'var(--color-noche)', borderColor: 'var(--color-line)' }}
              >
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: 'var(--color-brand-tint)' }}
                >
                  🏠
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--color-nieve)' }}>
                    Soy cliente
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Buscás un servicio para tu hogar
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              {/* Prestador */}
              <button
                onClick={() => { navigate('/onboarding'); setShowLoginSheet(false) }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border text-left active:scale-[0.98] transition-all"
                style={{ backgroundColor: 'var(--color-noche)', borderColor: 'var(--color-bosque-lt)' }}
              >
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: 'var(--color-brand-tint)' }}
                >
                  🔧
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--color-nieve)' }}>
                    Soy prestador
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Ofrecés servicios y querés más clientes
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
        className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 border-t"
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
          to="/planes"
          className="flex flex-col items-center gap-1 active:scale-90 transition-all"
          style={{ color: 'var(--color-muted)' }}
        >
          <IconBriefcase />
          <span className="text-[10px] font-semibold uppercase tracking-widest">Sumate</span>
        </Link>
        <Link
          to="/planes"
          className="flex flex-col items-center gap-1 active:scale-90 transition-all"
          style={{ color: 'var(--color-muted)' }}
        >
          <IconPerson />
          <span className="text-[10px] font-semibold uppercase tracking-widest">Prestador</span>
        </Link>
      </nav>

    </div>
  )
}

// ─── ProviderMiniCard ─────────────────────────────────────────────────────────

type ProviderMiniCardProps = { provider: Provider }

function ProviderMiniCard({ provider }: ProviderMiniCardProps) {
  const navigate = useNavigate()
  const photo    = provider.photos?.[0] ?? FALLBACK_PHOTO

  return (
    <button
      onClick={() => navigate(`/prestador/${provider.id}`)}
      className="snap-start shrink-0 w-36 text-left active:scale-[0.98] transition-transform"
    >
      <div
        className="relative aspect-square w-36 rounded-xl overflow-hidden border"
        style={{ borderColor: 'var(--color-line)' }}
      >
        <img
          src={photo}
          alt={provider.name}
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center top' }}
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_PHOTO }}
        />
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
          <span style={{ color: '#E8A020' }}>★</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
            {provider.rating.toFixed(1)}
          </span>
          <span className="opacity-40">·</span>
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
        className="aspect-square w-36 rounded-xl animate-pulse"
        style={{ backgroundColor: 'var(--color-sombra)' }}
      />
      <div className="mt-2 space-y-1.5">
        <div className="h-3.5 w-28 rounded animate-pulse" style={{ backgroundColor: 'var(--color-sombra)' }} />
        <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--color-sombra)' }} />
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
      className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all active:scale-90"
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
