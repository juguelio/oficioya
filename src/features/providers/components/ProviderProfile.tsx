import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { mockProviders } from '@/data/mock-providers'
import { ciudades, rubros } from '@/design-system/tokens'
import { useDashboardStore, getProviderReviews, getAverageRating } from '@/features/dashboard/store'
import { track } from '@/lib/analytics'
import { cn } from '@/shared/utils/cn'
import { supabase } from '@/lib/supabase'
import { toProvider } from '@/features/providers/hooks/useProviders'
import type { Provider } from '@/features/providers/types'
import type { DbProviderPublic } from '@/lib/database.types'

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

const reviewSchema = z.object({
  authorName: z.string().min(2, 'Ingresá tu nombre'),
  rating:     z.number().min(1).max(5),
  comment:    z.string().min(10, 'Escribí al menos 10 caracteres'),
})
type ReviewFormData = z.infer<typeof reviewSchema>

export function ProviderProfile() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const allReviews = useDashboardStore(s => s.reviews)
  const addReview  = useDashboardStore(s => s.addReview)

  const [showReviewSheet, setShowReviewSheet] = useState(false)
  const [hoverStar, setHoverStar]             = useState(0)
  const [reviewSent, setReviewSent]           = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<ReviewFormData>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 0 } })

  const selectedRating = watch('rating')

  // undefined = cargando · null = no encontrado
  const [provider, setProvider] = useState<Provider | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) { setProvider(null); return }
      const { data } = await supabase.from('providers_public').select('*').eq('id', id).maybeSingle()
      if (cancelled) return
      if (data) { setProvider(toProvider(data as DbProviderPublic)); return }
      setProvider(mockProviders.find(p => p.id === id) ?? null)  // fallback ids mock viejos
    })()
    return () => { cancelled = true }
  }, [id])

  if (provider === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[--color-muted]" style={{ backgroundColor: 'var(--color-noche)' }}>
        Cargando…
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[--color-nieve]" style={{ backgroundColor: 'var(--color-noche)' }}>
        <p className="text-[--color-muted]">Prestador no encontrado.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-[--radius-lg] text-sm font-semibold border border-[--color-bosque-lt]/40 hover:border-[--color-bosque-lt] transition-all active:scale-95"
          style={{ backgroundColor: 'var(--color-sombra)', color: 'var(--color-nieve)' }}
        >
          ← Volver
        </button>
      </div>
    )
  }

  const ciudadData  = ciudades.find(c => c.id === provider.ciudad)
  const rubroData   = rubros.find(r => r.id === provider.rubro)
  const img         = provider.photos?.[0] ?? (RUBRO_IMAGES[provider.rubro] ?? FALLBACK_IMG)
  const waLink      = `https://wa.me/${provider.phone.replace(/\D/g, '')}`
  const myReviews   = getProviderReviews(allReviews, provider.id)
  const avgRating   = getAverageRating(myReviews)

  function onSubmitReview(data: ReviewFormData) {
    addReview({ providerId: provider!.id, authorName: data.authorName, rating: data.rating, comment: data.comment })
    setShowReviewSheet(false)
    setReviewSent(true)
    reset()
  }

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
          <h1
            className="font-bold text-base text-[--color-nieve] leading-tight truncate"
            style={{ letterSpacing: '-0.02em' }}
          >
            {provider.name}
          </h1>
        </div>
        {provider.subscription === 'destacado' && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: '#E8A020', color: '#fff' }}>
            Destacado
          </span>
        )}
      </header>

      <main className="pt-16 pb-32 max-w-xl mx-auto">

        {/* ── Hero photo ─────────────────────────────────────────────────────────── */}
        <div className="relative h-72 w-full">
          <img
            src={img}
            alt={provider.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center top' }}
            onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)' }} />

          {/* Rating badge — Oficio si reclamado; si no, señal externa (Google) etiquetada. Nunca
              mostramos el rating de Oficio (0) de un perfil sin reclamar como si fuera real. */}
          {provider.claimed && provider.rating > 0 ? (
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full flex items-center gap-1 border border-[--color-line]" style={{ backgroundColor: 'rgba(14,21,16,0.75)' }}>
              <span className="text-[--color-bosque-lt] text-sm leading-none">★</span>
              <span className="text-[--color-nieve] text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{provider.rating.toFixed(1)}</span>
            </div>
          ) : provider.externalRating ? (
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full flex items-center gap-1.5 border border-[--color-line]" style={{ backgroundColor: 'rgba(14,21,16,0.75)' }}>
              <span className="text-[#E8A020] text-sm leading-none">★</span>
              <span className="text-[--color-nieve] text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{provider.externalRating.toFixed(1)}</span>
              <span className="text-[--color-muted] text-[10px] font-semibold">Google</span>
            </div>
          ) : null}

          {/* Badge: verificado (verde) si lo está; "Sin confirmar" (muted) si es un perfil sin reclamar */}
          {provider.isVerified ? (
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold border border-[--color-line]" style={{ backgroundColor: 'rgba(14,21,16,0.75)', color: 'var(--color-bosque-lt)' }}>
              ✓ Verificado
            </div>
          ) : !provider.claimed ? (
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold border border-[--color-line]" style={{ backgroundColor: 'rgba(14,21,16,0.75)', color: 'var(--color-muted)' }}>
              Sin confirmar
            </div>
          ) : null}
        </div>

        {/* ── Info block ─────────────────────────────────────────────────────────── */}
        <div className="px-6 pt-5">

          {/* Name + rubro */}
          <div className="mb-4">
            <h2
              className="text-2xl font-bold text-[--color-nieve] mb-1"
              style={{ letterSpacing: '-0.02em' }}
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
            style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-mono)' }}
          >
            <div>
              <p className="text-xl font-bold text-[--color-nieve]">{provider.totalJobs}</p>
              <p className="text-xs text-[--color-muted] uppercase tracking-widest">Trabajos</p>
            </div>
            <div>
              {provider.claimed && provider.rating > 0 ? (
                <>
                  <p className="text-xl font-bold text-[--color-nieve]">{provider.rating.toFixed(1)}</p>
                  <p className="text-xs text-[--color-muted] uppercase tracking-widest">Calificación</p>
                </>
              ) : provider.externalRating ? (
                <>
                  <p className="text-xl font-bold text-[--color-nieve]">★ {provider.externalRating.toFixed(1)}</p>
                  <p className="text-xs text-[--color-muted] uppercase tracking-widest">en Google{provider.externalReviews ? ` · ${provider.externalReviews}` : ''}</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-[--color-muted]">—</p>
                  <p className="text-xs text-[--color-muted] uppercase tracking-widest">Calificación</p>
                </>
              )}
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: provider.isVerified ? 'var(--color-bosque-lt)' : 'var(--color-muted)' }}>
                {provider.isVerified ? '✓' : '—'}
              </p>
              <p className="text-xs text-[--color-muted] uppercase tracking-widest">Verificado</p>
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

          {/* Contacto — sólo si el perfil está reclamado (activo). Si no, queda oculto
              hasta que el prestador confirme su membresía. */}
          {provider.claimed ? (
            <>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('whatsapp_click', { providerId: provider.id, ciudad: provider.ciudad, rubro: provider.rubro, source: 'profile' })}
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
              <p className="text-center text-xs text-[--color-muted] mt-3 mb-8" style={{ fontFamily: 'var(--font-mono)' }}>
                {provider.phone.replace(/(\+54)(9)(\d{4})(\d{3})(\d{4})/, '$1 $2 $3 $4-$5')}
              </p>
            </>
          ) : (
            <div className="rounded-[--radius-xl] px-5 py-5 mb-8 text-center border" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
              <p className="text-sm font-bold text-[--color-nieve] mb-1">
                Este profesional todavía no activó su perfil en Oficio.
              </p>
              <p className="text-xs text-[--color-muted] leading-relaxed">
                Lo encontramos en directorios locales. Cuando confirme su perfil vas a poder contactarlo directo por acá.
              </p>
            </div>
          )}

        </div>

        {/* ── Reseñas ──────────────────────────────────────────────────────────── */}
        <div className="px-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-lg" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
                Reseñas
              </h3>
              {avgRating > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span style={{ color: '#E8A020' }}>★</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-nieve)', fontFamily: 'var(--font-mono)' }}>{avgRating.toFixed(1)}</span>
                  <span className="text-sm" style={{ color: 'var(--color-muted)' }}>({myReviews.length})</span>
                </div>
              )}
            </div>
            <button
              onClick={() => { setShowReviewSheet(true); setReviewSent(false) }}
              className="text-xs font-bold px-3 py-1.5 rounded-full border active:scale-95 transition-all"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-nieve)', backgroundColor: 'var(--color-sombra)' }}
            >
              + Dejar reseña
            </button>
          </div>

          {reviewSent && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 border"
              style={{ backgroundColor: 'var(--color-brand-tint)', borderColor: 'var(--color-bosque-lt)' }}
            >
              <span>✅</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-bosque-lt)' }}>¡Reseña publicada! Gracias.</p>
            </div>
          )}

          {myReviews.length === 0 ? (
            <div
              className="flex flex-col items-center py-10 rounded-xl border text-center"
              style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
            >
              <span className="text-4xl mb-2">💬</span>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-nieve)' }}>Sin reseñas todavía</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Sé el primero en compartir tu experiencia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myReviews.map(r => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                        style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-lt)' }}
                      >
                        {r.authorName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--color-nieve)' }}>{r.authorName}</p>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= r.rating ? '#E8A020' : 'var(--color-line)'}>
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] shrink-0 mt-1" style={{ color: 'var(--color-muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* ── Sheet: Dejar reseña ─────────────────────────────────────────────────── */}
      {showReviewSheet && (
        <div
          className="fixed inset-0 z-[200] flex flex-col justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowReviewSheet(false)}
        >
          <div
            className="rounded-t-2xl px-5 pt-4 pb-10"
            style={{ backgroundColor: 'var(--color-sombra)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: 'var(--color-line)' }} />
            <h3 className="font-black text-lg mb-1" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
              Dejar reseña
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
              Tu opinión ayuda a otros clientes a elegir.
            </p>
            <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">

              {/* Estrellas */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
                  Calificación
                </label>
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => setHoverStar(i)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setValue('rating', i, { shouldValidate: true })}
                      className="active:scale-90 transition-all"
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill={i <= (hoverStar || selectedRating) ? '#E8A020' : 'var(--color-line)'} style={{ transition: 'fill 0.1s' }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                </div>
                {errors.rating && <p className="text-xs mt-1" style={{ color: '#ffb4ab' }}>Elegí una puntuación</p>}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-muted)' }}>Tu nombre</label>
                <input
                  {...register('authorName')}
                  placeholder="Ej: Marcela R."
                  className="w-full h-11 px-3 rounded-xl text-sm focus:outline-none placeholder:text-[var(--color-muted)]"
                  style={{ backgroundColor: 'var(--color-noche)', border: `1px solid ${errors.authorName ? '#ffb4ab' : 'var(--color-line)'}`, color: 'var(--color-nieve)' }}
                />
                {errors.authorName && <p className="text-xs mt-0.5" style={{ color: '#ffb4ab' }}>{errors.authorName.message}</p>}
              </div>

              {/* Comentario */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-muted)' }}>Tu experiencia</label>
                <textarea
                  {...register('comment')}
                  rows={3}
                  placeholder="Contá cómo fue el trabajo, puntualidad, precio..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none placeholder:text-[var(--color-muted)]"
                  style={{ backgroundColor: 'var(--color-noche)', border: `1px solid ${errors.comment ? '#ffb4ab' : 'var(--color-line)'}`, color: 'var(--color-nieve)' }}
                />
                {errors.comment && <p className="text-xs mt-0.5" style={{ color: '#ffb4ab' }}>{errors.comment.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full font-bold text-sm text-white active:scale-[0.98] transition-all disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-bosque-lt)' }}
              >
                Publicar reseña
              </button>
            </form>
          </div>
        </div>
      )}

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
