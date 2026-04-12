import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import { ciudades, rubros } from '@/design-system/tokens'
import { formatARS } from '@/shared/utils/formatARS'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { sendWelcomeEmail, sendNewProviderAlert } from '@/lib/notifications'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name:                 z.string().min(2, 'Ingresá tu nombre completo'),
  email:                z.string().email('Email inválido'),
  password:             z.string().min(8, 'Mínimo 8 caracteres'),
  phone:                z.string().min(10, 'Número inválido').startsWith('+54', 'Incluí el código +54'),
  whatsapp_number:      z.string().min(10, 'Número inválido'),
  barrio:               z.string().min(2, 'Ingresá tu barrio o zona'),
  ciudad_id:            z.string().min(1, 'Elegí tu ciudad'),
  rubro_id:             z.string().min(1, 'Elegí tu rubro'),
  subscription_tier_id: z.enum(['basico', 'profesional', 'destacado'], {
    required_error: 'Elegí un plan para continuar',
  }),
})

type FormData = z.infer<typeof schema>

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  1: ['name', 'email', 'password', 'phone', 'whatsapp_number', 'barrio'],
  2: ['ciudad_id', 'rubro_id'],
  3: [],
  4: ['subscription_tier_id'],
}

// ─── Plan metadata ─────────────────────────────────────────────────────────────

const plans = [
  {
    id: 'basico'      as const,
    label: 'Básico',
    priceARS: 20000,
    contacts: '8 contactos/mes',
    features: ['Perfil público', 'Reseñas de clientes'],
    accent: '#4A8C49',
  },
  {
    id: 'profesional' as const,
    label: 'Profesional',
    priceARS: 35000,
    contacts: 'Contactos ilimitados',
    features: ['Badge ✓ verificado', 'Prioridad alta en búsquedas', 'Reseñas de clientes'],
    accent: '#2E6E8A',
  },
  {
    id: 'destacado'   as const,
    label: 'Destacado',
    priceARS: 55000,
    contacts: 'Contactos ilimitados',
    features: ['Badge ✓ verificado', 'Prioridad máxima + banner', 'Aparecés primero siempre'],
    accent: '#F5C842',
  },
]

// ─── ProviderSignup ───────────────────────────────────────────────────────────

export function ProviderSignup() {
  const navigate   = useNavigate()
  const { signUp } = useAuth()

  const [step,         setStep]         = useState<1 | 2 | 3 | 4>(1)
  const [photoFile,    setPhotoFile]    = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitError,  setSubmitError]  = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { phone: '+549', whatsapp_number: '+549' },
  })

  const { register, handleSubmit, trigger, watch, setValue, formState: { errors, isSubmitting } } = form

  const ciudadId = watch('ciudad_id')
  const rubroId  = watch('rubro_id')
  const tierId   = watch('subscription_tier_id')

  async function goNext() {
    const fields = STEP_FIELDS[step]
    const valid  = fields.length === 0 || await trigger(fields)
    if (valid) setStep(s => (s + 1) as typeof s)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function onSubmit(data: FormData) {
    setSubmitError(null)

    // 1. Create auth user — trigger inserts provider row from metadata
    const { data: authData, error: authError } = await signUp(data.email, data.password, {
      name:                 data.name,
      phone:                data.phone,
      whatsapp_number:      data.whatsapp_number,
      barrio:               data.barrio,
      ciudad_id:            data.ciudad_id,
      rubro_id:             data.rubro_id,
      subscription_tier_id: data.subscription_tier_id,
    })

    if (authError) {
      setSubmitError(
        authError.message === 'User already registered'
          ? 'Ya existe una cuenta con ese email. ¿Querés iniciar sesión?'
          : authError.message,
      )
      return
    }

    // 2. Upload photo if provided (only possible when session is immediate — email confirm off)
    if (photoFile && authData.session) {
      const ext  = photoFile.name.split('.').pop() ?? 'jpg'
      const path = `${authData.user!.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('provider-photos')
        .upload(path, photoFile, { contentType: photoFile.type, upsert: false })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('provider-photos').getPublicUrl(path)
        await supabase
          .from('providers')
          .update({ photos: [urlData.publicUrl] })
          .eq('auth_user_id', authData.user!.id)
      }
    }

    // fire-and-forget — don't await, don't block navigation
    sendWelcomeEmail({ email: data.email, name: data.name, plan: data.subscription_tier_id, ciudad: data.ciudad_id })
    sendNewProviderAlert({ name: data.name, email: data.email, rubro: data.rubro_id, ciudad: data.ciudad_id, plan: data.subscription_tier_id })

    navigate('/verificacion')
  }

  return (
    <div className="min-h-screen text-[--color-nieve]" style={{ backgroundColor: '#0e1419' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 backdrop-blur-xl flex items-center justify-between px-6 h-16"
        style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
      >
        <button
          type="button"
          onClick={() => step > 1 ? setStep(s => (s - 1) as typeof s) : navigate(-1)}
          className="p-2 rounded-xl text-[--color-bosque-lt] hover:bg-white/5 transition-all active:scale-95"
          aria-label="Volver"
        >
          <IconArrowLeft />
        </button>

        <div className="flex items-center gap-1.5">
          {([1, 2, 3, 4] as const).map(s => (
            <div
              key={s}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                s === step  ? 'w-8 bg-[--color-bosque-lt]'      :
                s < step    ? 'w-4 bg-[--color-bosque-lt]/50'    :
                              'w-4 bg-[#1E2E1E]',
              )}
            />
          ))}
        </div>

        <span className="text-xs font-bold tracking-widest text-[--color-muted] uppercase">
          {step}/4
        </span>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <main className="pt-24 pb-32 px-6 max-w-xl mx-auto">

          {/* ── Step 1: Datos personales ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-[--color-bosque-lt] uppercase mb-1">Paso 1 de 4</p>
                <h1
                  className="text-3xl font-bold text-[--color-nieve] mb-2"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                >
                  Tus datos personales
                </h1>
                <p className="text-sm text-[--color-muted]">Los clientes van a ver tu nombre y foto.</p>
              </div>

              <div className="space-y-4">
                <Field label="Nombre completo" error={errors.name?.message}>
                  <input {...register('name')} type="text" placeholder="Ej: María Quintana" className={inputCls(!!errors.name)} />
                </Field>

                <Field label="Email" error={errors.email?.message}>
                  <input {...register('email')} type="email" placeholder="tu@email.com" className={inputCls(!!errors.email)} autoComplete="email" />
                </Field>

                <Field label="Contraseña" error={errors.password?.message}>
                  <input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" className={inputCls(!!errors.password)} autoComplete="new-password" />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Teléfono" error={errors.phone?.message}>
                    <input {...register('phone')} type="tel" placeholder="+5492944..." className={inputCls(!!errors.phone)} />
                  </Field>
                  <Field label="WhatsApp" error={errors.whatsapp_number?.message}>
                    <input {...register('whatsapp_number')} type="tel" placeholder="+5492944..." className={inputCls(!!errors.whatsapp_number)} />
                  </Field>
                </div>

                <Field label="Barrio / Zona" error={errors.barrio?.message}>
                  <input {...register('barrio')} type="text" placeholder="Ej: Melipal, El Cruce, Centro" className={inputCls(!!errors.barrio)} />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 2: Ciudad y rubro ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-[--color-bosque-lt] uppercase mb-1">Paso 2 de 4</p>
                <h1
                  className="text-3xl font-bold text-[--color-nieve] mb-2"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                >
                  Tu especialidad
                </h1>
                <p className="text-sm text-[--color-muted]">Elegí dónde trabajás y qué hacés.</p>
              </div>

              {/* Ciudad */}
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-[--color-muted] uppercase mb-3">¿En qué ciudad?</p>
                <div className="flex flex-col gap-2">
                  {ciudades.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setValue('ciudad_id', c.id, { shouldValidate: true })}
                      className={cn(
                        'flex items-center justify-between px-5 py-4 rounded-[--radius-xl] border text-left transition-all active:scale-[0.98]',
                        ciudadId === c.id
                          ? 'border-[--color-bosque-lt] bg-[--color-bosque-lt]/10 text-[--color-nieve]'
                          : 'border-[#1E2E1E] bg-[--color-sombra] text-[--color-muted] hover:border-[--color-bosque-lt]/40',
                      )}
                    >
                      <span className="font-semibold text-sm">{c.label}</span>
                      {ciudadId === c.id && <IconCheck />}
                    </button>
                  ))}
                </div>
                {errors.ciudad_id && <p className="text-xs mt-2" style={{ color: '#ffb4ab' }}>{errors.ciudad_id.message}</p>}
              </div>

              {/* Rubro */}
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-[--color-muted] uppercase mb-3">¿Cuál es tu rubro?</p>
                <div className="grid grid-cols-2 gap-2">
                  {rubros.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setValue('rubro_id', r.id, { shouldValidate: true })}
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-3 rounded-[--radius-lg] border text-left transition-all active:scale-[0.98]',
                        rubroId === r.id
                          ? 'border-[--color-bosque-lt] bg-[--color-bosque-lt]/10'
                          : 'border-[#1E2E1E] bg-[--color-sombra] hover:border-[--color-bosque-lt]/40',
                      )}
                    >
                      <span className="text-xl leading-none">{r.icon}</span>
                      <span className={cn('text-sm font-semibold', rubroId === r.id ? 'text-[--color-nieve]' : 'text-[--color-muted]')}>
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.rubro_id && <p className="text-xs mt-2" style={{ color: '#ffb4ab' }}>{errors.rubro_id.message}</p>}
              </div>
            </div>
          )}

          {/* ── Step 3: Foto de perfil ────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-[--color-bosque-lt] uppercase mb-1">Paso 3 de 4</p>
                <h1
                  className="text-3xl font-bold text-[--color-nieve] mb-2"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                >
                  Tu foto de perfil
                </h1>
                <p className="text-sm text-[--color-muted]">Una buena foto genera más confianza y más contactos.</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-full aspect-square max-h-72 rounded-[--radius-xl] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98]',
                  photoPreview ? 'border-[--color-bosque-lt]/40 p-0 overflow-hidden' : 'border-[#1E2E1E] hover:border-[--color-bosque-lt]/40',
                )}
                style={{ backgroundColor: '#090f14' }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <IconCamera />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[--color-nieve]">Tocá para subir una foto</p>
                      <p className="text-xs text-[--color-muted] mt-1">JPG, PNG o WEBP · Máx. 5 MB</p>
                    </div>
                  </>
                )}
              </button>

              {photoPreview && (
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  className="w-full py-2 text-sm text-[--color-muted] hover:text-[#ffb4ab] transition-colors"
                >
                  Sacar foto
                </button>
              )}

              <p className="text-xs text-center text-[--color-muted]">
                Podés agregar o cambiar la foto después desde tu perfil.
              </p>
            </div>
          )}

          {/* ── Step 4: Plan ──────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-[--color-bosque-lt] uppercase mb-1">Paso 4 de 4</p>
                <h1
                  className="text-3xl font-bold text-[--color-nieve] mb-2"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                >
                  Elegí tu plan
                </h1>
                <p className="text-sm text-[--color-muted]">Confirmás el pago después de crear tu perfil.</p>
              </div>

              <div className="space-y-3">
                {plans.map(plan => {
                  const selected = tierId === plan.id
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setValue('subscription_tier_id', plan.id, { shouldValidate: true })}
                      className={cn(
                        'w-full text-left rounded-[--radius-xl] border p-5 transition-all active:scale-[0.98]',
                        selected
                          ? 'border-[--color-bosque-lt] bg-[--color-bosque-lt]/10'
                          : 'border-[#1E2E1E] bg-[--color-sombra] hover:border-[--color-bosque-lt]/30',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: plan.id === 'destacado' ? '#F5C842' : plan.accent + '22',
                                color: plan.id === 'destacado' ? '#0e1419' : plan.accent,
                              }}
                            >
                              {plan.label}
                            </span>
                          </div>
                          <p className="text-xs text-[--color-muted]">{plan.contacts}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className="text-xl font-bold text-[--color-nieve]"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            {formatARS(plan.priceARS)}
                          </p>
                          <p className="text-xs text-[--color-muted]">/mes</p>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-[--color-muted]">
                            <span style={{ color: plan.accent }}>✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      {selected && (
                        <div
                          className="mt-3 pt-3 border-t text-xs font-semibold flex items-center gap-1.5"
                          style={{ borderColor: '#1E2E1E', color: plan.accent }}
                        >
                          <IconCheck size={12} /> Plan seleccionado
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {errors.subscription_tier_id && (
                <p className="text-xs" style={{ color: '#ffb4ab' }}>{errors.subscription_tier_id.message}</p>
              )}

              {submitError && (
                <div
                  className="px-4 py-3 rounded-[--radius-lg] text-sm font-semibold"
                  style={{ backgroundColor: '#ffb4ab18', color: '#ffb4ab', border: '1px solid #ffb4ab30' }}
                >
                  {submitError}
                </div>
              )}
            </div>
          )}

        </main>

        {/* ── Bottom action bar ──────────────────────────────────────────────── */}
        <div
          className="fixed bottom-0 left-0 w-full px-6 py-4 backdrop-blur-xl"
          style={{ backgroundColor: 'rgba(14,20,25,0.92)' }}
        >
          <div className="max-w-xl mx-auto space-y-2">
            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                className="w-full h-14 rounded-[--radius-full] font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ backgroundColor: '#4A8C49', color: '#fff' }}
              >
                {step === 3 && !photoFile ? 'Saltar por ahora' : 'Siguiente'}
                <IconArrowRight />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-[--radius-full] font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#4A8C49', color: '#fff' }}
              >
                {isSubmitting ? 'Creando tu perfil…' : 'Crear mi perfil'}
                {!isSubmitting && <IconArrowRight />}
              </button>
            )}

            {step === 1 && (
              <p className="text-xs text-center text-[--color-muted]">
                ¿Ya tenés cuenta?{' '}
                <Link to="/login" className="text-[--color-bosque-lt] font-semibold hover:underline">
                  Iniciá sesión
                </Link>
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

type FieldProps = { label: string; error?: string; children: React.ReactNode }

function Field({ label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: '#adcec0' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs font-semibold" style={{ color: '#ffb4ab' }}>{error}</p>}
    </div>
  )
}

// ─── Style helpers ─────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return cn(
    'w-full h-14 px-4 rounded-xl bg-[#090f14] text-[--color-nieve]',
    'placeholder:text-[#414845] transition-shadow',
    'focus:outline-none focus:ring-1 focus:ring-[rgba(173,206,192,0.4)]',
    hasError ? 'ring-1 ring-[#ffb4ab]/60' : '',
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconCamera() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4A8C49' }}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
