import { useEffect } from 'react'
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom'
import { ciudades, rubros } from '@/design-system/tokens'
import { useCityStore } from '@/features/search/store'
import { useProviders } from '@/features/providers/hooks'
import { track } from '@/lib/analytics'
import { cn } from '@/shared/utils/cn'
import type { RubroId, CiudadId } from '@/design-system/tokens'
import type { Provider } from '@/features/providers/types'

// ─── Placeholder images per rubro (from Stitch) ───────────────────────────────
const RUBRO_IMAGES: Partial<Record<RubroId, string>> = {
  carpintero:   '/images/provider-carpintero2.png',
  electricista: '/images/provider-electricista2.png',
  albanil:      '/images/provider-albanil.png',
  jardinero:    '/images/provider-jardinero.png',
  plomero:      '/images/provider-electricista.png',
}
const FALLBACK_IMG = '/images/provider-carpintera.png'

// ─── RubroPage ────────────────────────────────────────────────────────────────

export function RubroPage() {
  const storeCiudadId = useCityStore(s => s.ciudadId)
  const setCiudad     = useCityStore(s => s.setCiudad)
  const setRubro      = useCityStore(s => s.setRubro)
  const clearCiudad   = useCityStore(s => s.clearCiudad)
  const { ciudad: ciudadParam, rubro } = useParams<{ ciudad: string; rubro: RubroId }>()
  const navigate = useNavigate()

  // URL params are the source of truth on navigation. Sync both ciudad and rubro to the store.
  const ciudadId = (ciudadParam as CiudadId) ?? storeCiudadId
  useEffect(() => {
    if (ciudadParam && ciudadParam !== storeCiudadId) {
      setCiudad(ciudadParam as CiudadId)
    }
    if (rubro) {
      setRubro(rubro)
    }
  }, [ciudadParam, rubro, storeCiudadId, setCiudad, setRubro])

  const ciudadData = ciudades.find(c => c.id === ciudadId)
  const rubroData  = rubros.find(r => r.id === rubro)

  const { providers, total, isEmpty, loading } = useProviders({
    ciudad: ciudadId ?? undefined,
    rubro:  rubro as RubroId,
  })

  if (!ciudadId || !ciudadData) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen text-[--color-nieve]" style={{ backgroundColor: 'var(--color-noche)' }}>

      {/* ── TopAppBar ──────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16 border-b border-[--color-line]"
        style={{ backgroundColor: 'var(--color-noche)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-[--color-bosque-lt] hover:bg-black/5 transition-colors active:scale-95 p-2 rounded-xl"
            aria-label="Volver"
          >
            <IconArrowLeft />
          </button>
          <div className="min-w-0">
            <h1
              className="font-bold text-base text-[--color-nieve] leading-tight truncate"
              style={{ letterSpacing: '-0.02em' }}
            >
              {rubroData?.icon} {rubroData?.label}
            </h1>
            <button
              onClick={clearCiudad}
              className="text-xs text-[--color-muted] hover:text-[--color-bosque-lt] transition-colors truncate"
            >
              {ciudadData?.label} ×
            </button>
          </div>
        </div>
        <Link
          to="/planes"
          className="text-xs font-semibold text-[--color-muted] hover:text-[--color-nieve] transition-colors shrink-0"
        >
          Soy prestador →
        </Link>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto">

        {/* ── Search + Filter pills ──────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex flex-col gap-4">
            {/* Search input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[--color-muted]">
                <IconSearch />
              </div>
              <input
                readOnly
                className="w-full rounded-xl py-4 pl-12 pr-4 text-[--color-nieve] placeholder:text-[--color-muted]/60 focus:outline-none focus:ring-1 focus:ring-[--color-bosque-lt]/40 transition-all border border-[--color-line]"
                style={{ backgroundColor: 'var(--color-sombra)' }}
                placeholder={`Buscar ${rubroData?.label?.toLowerCase() ?? 'profesionales'} en ${ciudadData?.label}…`}
              />
            </div>

            {/* Rubro filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {rubros.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setRubro(r.id); navigate(`/${ciudadId}/${r.id}`) }}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-all shrink-0 border',
                    r.id === rubro
                      ? 'bg-[--color-bosque-lt] text-white border-transparent'
                      : 'bg-[--color-sombra] text-[--color-muted] border-[--color-line] hover:text-[--color-nieve]',
                  )}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          {!loading && !isEmpty && (
            <p
              className="text-xs text-[--color-muted] mt-5 uppercase tracking-[0.18em] font-semibold"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <span className="text-[--color-bosque-lt]" style={{ fontFamily: 'var(--font-mono)' }}>{total}</span>
              {' '}{total === 1 ? 'profesional' : 'profesionales'} disponibles en {ciudadData?.label}
            </p>
          )}
        </section>

        {/* ── Provider list ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid gap-5">
            {[1, 2, 3].map(n => (
              <div key={n} className="rounded-xl overflow-hidden animate-pulse" style={{ backgroundColor: 'var(--color-sombra)' }}>
                <div className="h-48 w-full" style={{ backgroundColor: 'var(--color-noche)' }} />
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-5 w-2/3 rounded-md" style={{ backgroundColor: 'var(--color-noche)' }} />
                  <div className="h-3 w-1/2 rounded-md" style={{ backgroundColor: 'var(--color-noche)' }} />
                  <div className="h-12 w-full rounded-full mt-2" style={{ backgroundColor: 'var(--color-noche)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            rubro={rubroData?.label}
            ciudad={ciudadData?.label}
            onBack={() => navigate(-1)}
          />
        ) : (
          <div className="grid gap-5">
            {providers.map(p => (
              <ProviderListCard
                key={p.id}
                provider={p}
                fallbackImg={RUBRO_IMAGES[p.rubro] ?? FALLBACK_IMG}
              />
            ))}
          </div>
        )}

      </main>

      {/* ── Bottom Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 z-50 border-t border-[--color-line]"
        style={{ backgroundColor: 'var(--color-noche)' }}
      >
        <NavTab icon={<IconExplore />} label="Explorar" onClick={() => navigate('/')} />
        <NavTab icon={<IconSearch />}  label="Buscar" active />
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

// ─── ProviderListCard ─────────────────────────────────────────────────────────

type ProviderListCardProps = {
  provider: Provider
  fallbackImg: string
}

function ProviderListCard({ provider, fallbackImg }: ProviderListCardProps) {
  const img         = provider.photos?.[0] ?? fallbackImg
  // Perfiles sin reclamar tienen el WhatsApp enmascarado (phone=''): NO mostramos un CTA muerto
  // a wa.me/ vacío — mandamos al perfil (que maneja el estado "sin confirmar" y el claim).
  const claimed     = provider.claimed && provider.phone.replace(/\D/g, '').length > 0
  const waLink      = `https://wa.me/${provider.phone.replace(/\D/g, '')}`
  const ciudadLabel = ciudades.find(c => c.id === provider.ciudad)?.label ?? provider.ciudad
  const navigate    = useNavigate()

  return (
    <article
      className="rounded-xl overflow-hidden transition-all duration-300 group border border-[--color-line] sm:flex sm:flex-row"
      style={{ backgroundColor: 'var(--color-sombra)' }}
    >
      {/* Photo — mobile: full width banner / desktop: fixed left column */}
      <button
        className="relative h-48 w-full block text-left shrink-0 sm:w-52 sm:h-auto"
        onClick={() => navigate(`/prestador/${provider.id}`)}
        aria-label={`Ver perfil de ${provider.name}`}
      >
        <img
          src={img}
          alt={provider.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ objectPosition: 'center top' }}
          onError={e => { (e.target as HTMLImageElement).src = fallbackImg }}
        />
        {/* Rating badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full flex items-center gap-1 border border-[--color-line]"
          style={{ backgroundColor: 'rgba(14,21,16,0.75)' }}
        >
          <span className="text-[--color-bosque-lt] text-xs leading-none">★</span>
          <span className="text-[--color-nieve] text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
            {provider.rating.toFixed(1)}
          </span>
        </div>
        {/* Verified badge */}
        {provider.isVerified && (
          <div
            className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-[--color-bosque-lt] border border-[--color-bosque-lt]/40"
            style={{ backgroundColor: 'rgba(14,21,16,0.75)' }}
          >
            ✓ Verificado
          </div>
        )}
      </button>

      {/* Info — flex column so CTAs stay at bottom on desktop */}
      <div className="p-5 flex flex-col flex-1 min-w-0 sm:justify-between">

        {/* Top: name + meta + bio */}
        <div>
          <div className="flex justify-between items-start mb-1.5">
            <button
              className="text-left hover:text-[--color-bosque-lt] transition-colors min-w-0"
              onClick={() => navigate(`/prestador/${provider.id}`)}
            >
              <h2 className="text-lg font-bold text-[--color-nieve] truncate">
                {provider.name}
              </h2>
            </button>
            {provider.subscription === 'destacado' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 uppercase tracking-wide"
                style={{ backgroundColor: '#E8A020', color: '#fff' }}>
                Destacado
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-3 text-[--color-muted]">
            <IconLocation />
            <span className="text-xs font-semibold truncate">{provider.barrio ?? ciudadLabel}</span>
            <span className="text-xs shrink-0">·</span>
            <span className="text-xs shrink-0" style={{ fontFamily: 'var(--font-mono)' }}>
              {provider.totalJobs} trabajos
            </span>
          </div>

          {provider.bio && (
            <p className="text-sm text-[--color-muted] leading-relaxed line-clamp-2 sm:line-clamp-3">
              {provider.bio}
            </p>
          )}
        </div>

        {/* Bottom: CTAs */}
        <div className="mt-4">
          {claimed ? (
            <>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('whatsapp_click', { providerId: provider.id, ciudad: provider.ciudad, rubro: provider.rubro, source: 'rubro_list' })}
                className="w-full py-3 rounded-full flex items-center justify-center gap-2 font-bold text-sm text-white active:scale-[0.98] transition-transform"
                style={{ background: '#25D366' }}
              >
                <IconWhatsApp />
                Contactar por WhatsApp
              </a>
              <button
                onClick={() => navigate(`/prestador/${provider.id}`)}
                className="w-full mt-1.5 py-2 text-xs font-semibold text-[--color-muted] hover:text-[--color-nieve] transition-colors text-center active:scale-[0.98]"
              >
                Ver perfil completo →
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(`/prestador/${provider.id}`)}
              className="w-full py-3 rounded-full flex items-center justify-center gap-2 font-bold text-sm text-white active:scale-[0.98] transition-transform"
              style={{ backgroundColor: 'var(--color-bosque-lt)' }}
            >
              Ver perfil →
            </button>
          )}
        </div>

      </div>
    </article>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ rubro, ciudad, onBack }: { rubro?: string; ciudad?: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-5 max-w-xs mx-auto">
      <div
        className="w-16 h-16 rounded-[--radius-xl] flex items-center justify-center text-3xl border border-[--color-line]"
        style={{ backgroundColor: 'var(--color-sombra)' }}
      >
        🔍
      </div>
      <div>
        <h3 className="text-lg font-bold text-[--color-nieve] mb-2">
          Sin resultados todavía
        </h3>
        <p className="text-sm text-[--color-muted] leading-relaxed">
          No hay {rubro ? rubro.toLowerCase() : 'prestadores'} en{' '}
          {ciudad ?? 'esta ciudad'} aún.
          <br />
          Estamos sumando profesionales en la zona.
        </p>
      </div>
      <button
        onClick={onBack}
        className="px-6 py-3 rounded-[--radius-lg] text-sm font-semibold text-[--color-nieve] border border-[--color-bosque-lt]/40 hover:border-[--color-bosque-lt] transition-all"
        style={{ backgroundColor: 'var(--color-sombra)' }}
      >
        ← Ver otros rubros
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
      className={cn(
        'flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all active:scale-90 duration-150',
        active ? 'text-[--color-bosque-lt]' : 'text-[--color-muted] hover:text-[--color-bosque-lt]',
      )}
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

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function IconLocation() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
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
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.628 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}
