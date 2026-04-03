import { useParams, useNavigate } from 'react-router-dom'
import { mockProviders } from '@/data/mock-providers'
import { ciudades, rubros } from '@/design-system/tokens'
import { cn } from '@/shared/utils/cn'

// ─── Placeholder images per rubro ────────────────────────────────────────────
const FALLBACK_IMG = '/images/provider-carpintera.png'
import type { RubroId } from '@/design-system/tokens'

const RUBRO_IMAGES: Partial<Record<RubroId, string>> = {
  carpintero:   '/images/provider-carpintero2.png',
  electricista: '/images/provider-electricista2.png',
  albanil:      '/images/provider-albanil.png',
  jardinero:    '/images/provider-jardinero.png',
  plomero:      '/images/provider-electricista.png',
}

// ─── ProviderProfile ──────────────────────────────────────────────────────────

export function ProviderProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const provider = mockProviders.find(p => p.id === id)

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[--color-nieve]" style={{ backgroundColor: '#0e1419' }}>
        <p className="text-[--color-muted]">Prestador no encontrado.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-[--radius-lg] text-sm font-semibold border border-[--color-bosque-lt]/40 hover:border-[--color-bosque-lt] transition-all active:scale-95"
          style={{ backgroundColor: '#1a2026', color: '#EFF3EE' }}
        >
          ← Volver
        </button>
      </div>
    )
  }

  const ciudadData = ciudades.find(c => c.id === provider.ciudad)
  const rubroData  = rubros.find(r => r.id === provider.rubro)
  const img        = provider.photos?.[0] ?? (RUBRO_IMAGES[provider.rubro] ?? FALLBACK_IMG)
  const waLink     = `https://wa.me/${provider.phone.replace(/\D/g, '')}`

  return (
    <div className="min-h-screen text-[--color-nieve]" style={{ backgroundColor: '#0e1419' }}>

      {/* ── TopAppBar ──────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 backdrop-blur-xl shadow-2xl shadow-black/40 flex items-center justify-between px-6 h-16"
        style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-[--color-bosque-lt] hover:bg-white/5 transition-colors active:scale-95 p-2 rounded-xl"
            aria-label="Volver"
          >
            <IconArrowLeft />
          </button>
          <h1
            className="font-bold text-base text-[--color-nieve] leading-tight truncate"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            {provider.name}
          </h1>
        </div>
        {provider.subscription === 'destacado' && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: '#F5C842', color: '#0e1419' }}>
            Destacado
          </span>
        )}
      </header>

      <main className="pt-16 pb-32 max-w-xl mx-auto">

        {/* ── Hero photo ─────────────────────────────────────────────────────────── */}
        <div className="relative h-64 w-full">
          <img
            src={img}
            alt={provider.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center top' }}
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0e1419 0%, transparent 60%)' }} />

          {/* Rating badge */}
          <div
            className="absolute top-4 right-4 px-3 py-1 rounded-full flex items-center gap-1"
            style={{ backgroundColor: 'rgba(14,20,25,0.75)', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-[--color-bosque-lt] text-sm leading-none">★</span>
            <span className="text-[--color-nieve] text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
              {provider.rating.toFixed(1)}
            </span>
          </div>

          {/* Verified badge */}
          {provider.isVerified && (
            <div
              className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: 'rgba(14,20,25,0.75)', backdropFilter: 'blur(8px)', color: '#4A8C49' }}
            >
              ✓ Verificado
            </div>
          )}
        </div>

        {/* ── Info block ─────────────────────────────────────────────────────────── */}
        <div className="px-6 pt-5">

          {/* Name + rubro */}
          <div className="mb-4">
            <h2
              className="text-2xl font-bold text-[--color-nieve] mb-1"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              {provider.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[--color-bosque-lt]">
                {rubroData?.icon} {rubroData?.label}
              </span>
              <span className="text-[--color-muted] text-sm">·</span>
              <span className="text-sm text-[--color-muted]">
                {provider.barrio ? `${provider.barrio}, ` : ''}{ciudadData?.label}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="flex gap-6 py-4 border-y mb-5"
            style={{ borderColor: '#1E2E1E', fontFamily: 'var(--font-mono)' }}
          >
            <div>
              <p className="text-xl font-bold text-[--color-nieve]">{provider.totalJobs}</p>
              <p className="text-xs text-[--color-muted] uppercase tracking-widest">Trabajos</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[--color-nieve]">{provider.rating.toFixed(1)}</p>
              <p className="text-xs text-[--color-muted] uppercase tracking-widest">Calificación</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[--color-nieve]">
                {provider.subscription ? provider.subscription.charAt(0).toUpperCase() + provider.subscription.slice(1) : 'Sin plan'}
              </p>
              <p className="text-xs text-[--color-muted] uppercase tracking-widest">Plan</p>
            </div>
          </div>

          {/* Bio */}
          {provider.bio && (
            <div className="mb-6">
              <p className="text-xs font-bold tracking-[0.15em] text-[--color-muted] uppercase mb-2">Sobre mí</p>
              <p className="text-sm text-[--color-nieve]/80 leading-relaxed">
                {provider.bio}
              </p>
            </div>
          )}

          {/* WhatsApp CTA — primary action */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-[--radius-full]',
              'py-4 font-bold text-white text-base',
              'active:scale-[0.98] transition-transform shadow-lg',
            )}
            style={{ background: '#25D366' }}
          >
            <IconWhatsApp />
            Contactar por WhatsApp
          </a>

          {/* Secondary: phone number visible */}
          <p className="text-center text-xs text-[--color-muted] mt-3" style={{ fontFamily: 'var(--font-mono)' }}>
            {provider.phone.replace(/(\+54)(9)(\d{4})(\d{3})(\d{4})/, '$1 $2 $3 $4-$5')}
          </p>

        </div>

      </main>

    </div>
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

function IconWhatsApp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}
