import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ciudades, rubros } from '@/design-system/tokens'
import { useCityStore } from '@/features/search/store'
import { postJob } from '@/features/jobs/hooks'
import { cn } from '@/shared/utils/cn'
import type { CiudadId, RubroId } from '@/design-system/tokens'

const schema = z.object({
  rubro:        z.string().min(1, 'Elegí un rubro'),
  ciudad:       z.string().min(1, 'Elegí una ciudad'),
  title:        z.string().min(10, 'El título debe tener al menos 10 caracteres'),
  description:  z.string().min(20, 'Describí el trabajo con más detalle'),
  budgetMax:    z.coerce.number().optional(),
  authorName:   z.string().min(2, 'Ingresá tu nombre'),
  authorPhone:  z.string().min(10, 'Incluí tu WhatsApp con código +54').startsWith('+54', 'Incluí el código +54'),
})
type FormData = z.infer<typeof schema>

// ─── PostJobPage ──────────────────────────────────────────────────────────────

export function PostJobPage() {
  const navigate  = useNavigate()
  const storedCiudadId = useCityStore(s => s.ciudadId)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        ciudad: storedCiudadId ?? '',
        authorPhone: '+549',
      },
    })

  const selectedRubro  = watch('rubro')
  const selectedCiudad = watch('ciudad')

  const [result, setResult]   = useState<{ id: string; token: string } | null>(null)
  const [error, setError]     = useState<string | null>(null)

  async function onSubmit(data: FormData) {
    setError(null)
    const res = await postJob({
      rubro:       data.rubro as RubroId,
      ciudad:      data.ciudad as CiudadId,
      title:       data.title,
      description: data.description,
      budgetMax:   data.budgetMax || undefined,
      authorName:  data.authorName,
      authorPhone: data.authorPhone,
    })
    if (!res) { setError('No se pudo publicar el trabajo. Probá de nuevo.'); return }
    // El aviso a prestadores se dispara SERVER-SIDE (trigger trg_notify_new_job →
    // n8n vía pg_net con header secreto). Ya no se llama al webhook desde el browser.
    setResult(res)
  }

  if (result) {
    // token en el fragment (#t=), no en la query — no se filtra por Referer/logs/analytics
    const trackUrl = `/trabajos/${result.id}#t=${result.token}`
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center" style={{ backgroundColor: 'var(--color-noche)' }}>
        <span className="text-6xl mb-5">🎉</span>
        <h2 className="font-black text-2xl mb-2" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
          ¡Trabajo publicado!
        </h2>
        <p className="text-sm mb-3" style={{ color: 'var(--color-muted)' }}>
          Los prestadores ya pueden verlo y enviarte presupuestos.
        </p>
        <p className="text-xs mb-8 px-4 py-3 rounded-xl" style={{ color: 'var(--color-nieve)', backgroundColor: 'var(--color-sombra)', border: '1px solid var(--color-line)' }}>
          📌 Guardá este link privado para ver y comparar los presupuestos. Es tu acceso, no lo compartas.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(trackUrl)}
            className="w-full py-3.5 rounded-full font-bold text-sm text-white active:scale-95 transition-all"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
            Ver mis presupuestos
          </button>
          <button
            onClick={() => navigate('/trabajos')}
            className="w-full py-3 rounded-full font-bold text-sm border active:scale-95 transition-all"
            style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
          >
            Ver todos los trabajos
          </button>
        </div>
      </div>
    )
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
          className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-all"
          style={{ backgroundColor: 'var(--color-noche)' }}
        >
          <IconBack />
        </button>
        <h1 className="font-black text-base" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
          Publicar trabajo
        </h1>
      </header>

      <main className="pt-14 pb-32">
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 pt-6 space-y-5">

          {/* Rubro */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
              ¿Qué necesitás?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {rubros.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setValue('rubro', r.id, { shouldValidate: true })}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center active:scale-[0.97] transition-all text-xs font-semibold',
                  )}
                  style={
                    selectedRubro === r.id
                      ? { backgroundColor: 'var(--color-bosque-lt)', borderColor: 'var(--color-bosque-lt)', color: '#fff' }
                      : { backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)', color: 'var(--color-nieve)' }
                  }
                >
                  <span className="text-xl leading-none">{r.icon}</span>
                  <span className="leading-tight">{r.label}</span>
                </button>
              ))}
            </div>
            {errors.rubro && <p className="text-xs mt-1" style={{ color: '#ffb4ab' }}>{errors.rubro.message}</p>}
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
              ¿En qué ciudad?
            </label>
            <div className="flex gap-2">
              {ciudades.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setValue('ciudad', c.id, { shouldValidate: true })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border active:scale-95 transition-all"
                  style={
                    selectedCiudad === c.id
                      ? { backgroundColor: 'var(--color-bosque-lt)', borderColor: 'var(--color-bosque-lt)', color: '#fff' }
                      : { backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)', color: 'var(--color-muted)' }
                  }
                >
                  {c.label.split(' ')[0]}
                </button>
              ))}
            </div>
            {errors.ciudad && <p className="text-xs mt-1" style={{ color: '#ffb4ab' }}>{errors.ciudad.message}</p>}
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
              Título del trabajo
            </label>
            <input
              {...register('title')}
              placeholder="Ej: Reparar pérdida de agua en cocina"
              className="w-full h-12 px-4 rounded-xl text-sm focus:outline-none placeholder:text-[var(--color-muted)]"
              style={{
                backgroundColor: 'var(--color-sombra)',
                border: `1px solid ${errors.title ? '#ffb4ab' : 'var(--color-line)'}`,
                color: 'var(--color-nieve)',
              }}
            />
            {errors.title && <p className="text-xs mt-1" style={{ color: '#ffb4ab' }}>{errors.title.message}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
              Descripción
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Describí el trabajo con el mayor detalle posible: qué hay que hacer, dónde, si tenés materiales, urgencia, etc."
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none placeholder:text-[var(--color-muted)]"
              style={{
                backgroundColor: 'var(--color-sombra)',
                border: `1px solid ${errors.description ? '#ffb4ab' : 'var(--color-line)'}`,
                color: 'var(--color-nieve)',
              }}
            />
            {errors.description && <p className="text-xs mt-1" style={{ color: '#ffb4ab' }}>{errors.description.message}</p>}
          </div>

          {/* Presupuesto estimado (opcional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
              Presupuesto máximo <span className="normal-case font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none"
                style={{ color: 'var(--color-muted)' }}
              >
                $
              </span>
              <input
                {...register('budgetMax')}
                type="number"
                placeholder="50000"
                className="w-full h-12 pl-8 pr-4 rounded-xl text-sm focus:outline-none placeholder:text-[var(--color-muted)]"
                style={{
                  backgroundColor: 'var(--color-sombra)',
                  border: '1px solid var(--color-line)',
                  color: 'var(--color-nieve)',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
          </div>

          {/* Tu nombre */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
              Tu nombre
            </label>
            <input
              {...register('authorName')}
              placeholder="Ej: Marcela R."
              className="w-full h-12 px-4 rounded-xl text-sm focus:outline-none placeholder:text-[var(--color-muted)]"
              style={{
                backgroundColor: 'var(--color-sombra)',
                border: `1px solid ${errors.authorName ? '#ffb4ab' : 'var(--color-line)'}`,
                color: 'var(--color-nieve)',
              }}
            />
            {errors.authorName && <p className="text-xs mt-1" style={{ color: '#ffb4ab' }}>{errors.authorName.message}</p>}
          </div>

          {/* Tu WhatsApp */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
              Tu WhatsApp
            </label>
            <input
              {...register('authorPhone')}
              type="tel"
              placeholder="+5492972..."
              className="w-full h-12 px-4 rounded-xl text-sm focus:outline-none placeholder:text-[var(--color-muted)]"
              style={{
                backgroundColor: 'var(--color-sombra)',
                border: `1px solid ${errors.authorPhone ? '#ffb4ab' : 'var(--color-line)'}`,
                color: 'var(--color-nieve)',
              }}
            />
            {errors.authorPhone && <p className="text-xs mt-1" style={{ color: '#ffb4ab' }}>{errors.authorPhone.message}</p>}
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
              Privado: nunca se muestra a los prestadores. Sólo lo usamos para tu link de seguimiento.
            </p>
          </div>

        </form>
      </main>

      {/* ── CTA fijo ───────────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 w-full px-5 py-4 border-t"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        {error && <p className="text-xs mb-2 text-center" style={{ color: '#ffb4ab' }}>{error}</p>}
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="w-full py-4 rounded-full font-bold text-sm text-white active:scale-[0.98] transition-all disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-bosque-lt)' }}
        >
          {isSubmitting ? 'Publicando...' : 'Publicar trabajo'}
        </button>
      </div>

    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-nieve)' }}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}
