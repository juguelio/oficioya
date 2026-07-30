import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { ciudades, rubros } from '@/design-system/tokens'

const FALLBACK_PHOTO = '/images/user-avatar.png'

const schema = z.object({
  name:            z.string().min(2, 'Poné tu nombre o el de tu negocio'),
  rubro_id:        z.string().min(1, 'Elegí un rubro'),
  ciudad_id:       z.string().min(1, 'Elegí tu ciudad'),
  barrio:          z.string().max(60, 'Muy largo').optional(),
  whatsapp_number: z.string().min(8, 'Ingresá tu WhatsApp'),
  bio:             z.string().max(280, 'Máximo 280 caracteres').optional(),
})
type FormData = z.infer<typeof schema>

const INPUT_CLASS =
  'w-full h-14 px-4 rounded-xl text-[--color-nieve] placeholder:text-[--color-muted] border ' +
  'focus:outline-none focus:ring-1 focus:ring-[--color-bosque-lt]/40'

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--color-muted)' }}>{label}</label>
      {children}
      {hint && !error && <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>{hint}</p>}
      {error && <p className="text-xs mt-1.5" style={{ color: '#ffb4ab' }}>{error}</p>}
    </div>
  )
}

// ─── ProviderProfileEdit — /perfil ───────────────────────────────────────────────
export function ProviderProfileEdit() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const [state, setState]   = useState<'loading' | 'ready' | 'none'>('loading')
  const [photo, setPhoto]   = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved]   = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const bio = watch('bio') ?? ''

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/login'); return }
    let cancelled = false
    supabase
      .from('providers')
      .select('name,rubro_id,ciudad_id,barrio,whatsapp_number,bio,photos')
      .eq('auth_user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) { setState('none'); return }
        reset({
          name:            data.name ?? '',
          rubro_id:        data.rubro_id ?? '',
          ciudad_id:       data.ciudad_id ?? '',
          barrio:          data.barrio ?? '',
          whatsapp_number: data.whatsapp_number ?? '',
          bio:             data.bio ?? '',
        })
        setPhoto(data.photos?.[0] ?? null)
        setState('ready')
      })
    return () => { cancelled = true }
  }, [user, loading, navigate, reset])

  async function handlePhoto(file: File) {
    if (!user) return
    setUploading(true); setSaveError(null)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('provider-photos')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (upErr) { setUploading(false); setSaveError('No pudimos subir la foto. Probá con otra.'); return }

    const { data: urlData } = supabase.storage.from('provider-photos').getPublicUrl(path)
    const { error: dbErr } = await supabase
      .from('providers')
      .update({ photos: [urlData.publicUrl] })
      .eq('auth_user_id', user.id)

    setUploading(false)
    if (dbErr) { setSaveError('Subimos la foto pero no pudimos guardarla. Probá de nuevo.'); return }
    setPhoto(urlData.publicUrl)
  }

  async function onSubmit(data: FormData) {
    if (!user) return
    setSaveError(null); setSaved(false)
    const { error } = await supabase
      .from('providers')
      .update({
        name:            data.name.trim(),
        rubro_id:        data.rubro_id,
        ciudad_id:       data.ciudad_id,
        barrio:          data.barrio?.trim() || null,
        whatsapp_number: data.whatsapp_number.trim(),
        bio:             data.bio?.trim() || null,
      })
      .eq('auth_user_id', user.id)

    if (error) { setSaveError('No pudimos guardar los cambios. Probá de nuevo.'); return }
    reset(data)   // limpia isDirty sin perder los valores
    setSaved(true)
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen pt-24 px-6 max-w-xl mx-auto" style={{ backgroundColor: 'var(--color-noche)' }}>
        <div className="h-8 w-40 rounded-lg animate-pulse mb-6" style={{ backgroundColor: 'var(--color-line)' }} />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-14 rounded-xl animate-pulse mb-5" style={{ backgroundColor: 'var(--color-line)' }} />
        ))}
      </div>
    )
  }

  if (state === 'none') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-8 text-center" style={{ backgroundColor: 'var(--color-noche)' }}>
        <p className="font-bold text-lg" style={{ color: 'var(--color-nieve)' }}>Todavía no tenés perfil</p>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Tu cuenta no está asociada a ningún prestador.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-noche)' }}>
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-3 px-5 h-14 border-b"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-all"
          style={{ backgroundColor: 'var(--color-noche)', color: 'var(--color-nieve)' }}
        >
          <IconBack />
        </button>
        <p className="font-black text-sm" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.01em' }}>Editar mi perfil</p>
      </header>

      <main className="pt-14 pb-32 max-w-xl mx-auto px-5">

        {/* Foto */}
        <div className="flex items-center gap-4 py-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border shrink-0" style={{ borderColor: 'var(--color-line)' }}>
            <img
              src={photo ?? FALLBACK_PHOTO}
              alt="Tu foto"
              className="w-full h-full object-cover object-top"
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK_PHOTO }}
            />
          </div>
          <div>
            <label
              className="inline-block text-xs font-bold px-4 py-2.5 rounded-full border cursor-pointer active:scale-95 transition-all"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-nieve)' }}
            >
              {uploading ? 'Subiendo…' : 'Cambiar foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f) }}
              />
            </label>
            <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>Se guarda al instante</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Field label="Nombre o negocio" error={errors.name?.message}>
            <input
              {...register('name')}
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--color-sombra)', borderColor: errors.name ? '#ffb4ab' : 'var(--color-line)' }}
            />
          </Field>

          <Field label="Rubro" error={errors.rubro_id?.message}>
            <select
              {...register('rubro_id')}
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--color-sombra)', borderColor: errors.rubro_id ? '#ffb4ab' : 'var(--color-line)' }}
            >
              {rubros.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
            </select>
          </Field>

          <Field label="Ciudad" error={errors.ciudad_id?.message}>
            <select
              {...register('ciudad_id')}
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--color-sombra)', borderColor: errors.ciudad_id ? '#ffb4ab' : 'var(--color-line)' }}
            >
              {ciudades.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>

          <Field label="Barrio" error={errors.barrio?.message} hint="Opcional — ayuda a que te encuentren cerca">
            <input
              {...register('barrio')}
              placeholder="Centro, Chacra 4…"
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--color-sombra)', borderColor: errors.barrio ? '#ffb4ab' : 'var(--color-line)' }}
            />
          </Field>

          <Field label="WhatsApp" error={errors.whatsapp_number?.message} hint="Es el número al que te van a escribir los clientes">
            <input
              {...register('whatsapp_number')}
              inputMode="tel"
              placeholder="+549..."
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--color-sombra)', borderColor: errors.whatsapp_number ? '#ffb4ab' : 'var(--color-line)' }}
            />
          </Field>

          <Field label="Sobre tu trabajo" error={errors.bio?.message} hint={`${bio.length}/280 — contá qué hacés y hace cuánto`}>
            <textarea
              {...register('bio')}
              rows={4}
              placeholder="Reparo heladeras y lavarropas a domicilio, todas las marcas…"
              className="w-full px-4 py-3 rounded-xl text-[--color-nieve] placeholder:text-[--color-muted] border focus:outline-none focus:ring-1 focus:ring-[--color-bosque-lt]/40"
              style={{ backgroundColor: 'var(--color-sombra)', borderColor: errors.bio ? '#ffb4ab' : 'var(--color-line)' }}
            />
          </Field>

          {saveError && <p className="text-sm text-center mb-3" style={{ color: '#ffb4ab' }}>{saveError}</p>}
          {saved && !isDirty && (
            <p className="text-sm text-center mb-3 font-semibold" style={{ color: 'var(--color-bosque-lt)' }}>Cambios guardados ✓</p>
          )}
        </form>
      </main>

      {/* Guardar — fijo abajo, siempre alcanzable con el pulgar */}
      <div
        className="fixed bottom-0 left-0 w-full z-50 px-5 py-4 border-t backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.85)', borderColor: 'var(--color-line)' }}
      >
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isDirty}
            className="w-full py-4 rounded-full font-bold text-white text-base active:scale-[0.98] transition-transform disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
