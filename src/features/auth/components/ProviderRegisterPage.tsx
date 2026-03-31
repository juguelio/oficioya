import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import { ciudades, rubros } from '@/design-system/tokens'

const HERO_IMG = '/images/register-forest.png'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  nombre:    z.string().min(2, 'Ingresá tu nombre completo'),
  whatsapp:  z.string().min(8, 'Ingresá un número válido'),
  email:     z.string().email('Email inválido'),
  password:  z.string().min(8, 'Mínimo 8 caracteres'),
  rubro:     z.string().min(1, 'Elegí un rubro'),
  ciudad:    z.string().min(1, 'Elegí una ciudad'),
  barrio:    z.string().min(2, 'Ingresá tu barrio o zona'),
  bio:       z.string().min(20, 'Contanos un poco más sobre tu experiencia (mín. 20 caracteres)'),
})

type FormData = z.infer<typeof schema>

// ─── ProviderRegisterPage ─────────────────────────────────────────────────────

export function ProviderRegisterPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function onSubmit(_data: FormData) {
    // TODO: Supabase auth + profile creation
    navigate('/verificacion')
  }

  return (
    <div className="min-h-screen text-[--color-nieve]" style={{ backgroundColor: '#0e1419' }}>

      {/* ── TopAppBar ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 backdrop-blur-xl flex items-center gap-4 px-6 h-16"
        style={{ backgroundColor: 'rgba(14,20,25,0.70)' }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/5 transition-all active:scale-95"
          style={{ color: '#3de273' }}
          aria-label="Volver"
        >
          <IconArrowLeft />
        </button>
        <h1
          className="text-xl font-bold text-[--color-nieve] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Registro de prestador
        </h1>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-xl mx-auto">

        {/* ── Hero banner ───────────────────────────────────────────────────────── */}
        <div className="mb-10 relative h-48 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          <img
            src={HERO_IMG}
            alt="Bosque patagónico"
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(0.3)', opacity: 0.6 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, #0e1419 0%, transparent 60%)' }}
          />
          <div className="absolute bottom-4 left-6">
            <h2
              className="text-2xl font-bold text-[--color-nieve] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Unite a la red de Oficio
            </h2>
            <p className="text-sm text-[--color-muted]">Ofrecé tus servicios en la Patagonia.</p>
          </div>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">

          {/* Sección: Identidad */}
          <div className="space-y-5">
            <Field label="Nombre completo" error={errors.nombre?.message}>
              <input
                {...register('nombre')}
                type="text"
                placeholder="Tu nombre y apellido"
                className={inputCls(!!errors.nombre)}
              />
            </Field>

            <Field label="Teléfono WhatsApp" error={errors.whatsapp?.message}>
              <input
                {...register('whatsapp')}
                type="tel"
                placeholder="+54 9 ..."
                className={inputCls(!!errors.whatsapp)}
              />
            </Field>

            <Field label="Email" error={errors.email?.message}>
              <input
                {...register('email')}
                type="email"
                placeholder="ejemplo@correo.com"
                className={inputCls(!!errors.email)}
              />
            </Field>

            <Field label="Contraseña" error={errors.password?.message}>
              <input
                {...register('password')}
                type="password"
                placeholder="Mínimo 8 caracteres"
                className={inputCls(!!errors.password)}
              />
            </Field>
          </div>

          {/* Sección: Especialidad */}
          <div className="rounded-2xl p-6 space-y-5" style={{ backgroundColor: '#161c22' }}>

            <Field label="Rubro" error={errors.rubro?.message}>
              <div className="relative">
                <select
                  {...register('rubro')}
                  className={cn(selectCls(!!errors.rubro), 'appearance-none pr-10')}
                  defaultValue=""
                >
                  <option value="" disabled>Seleccioná tu oficio</option>
                  {rubros.map(r => (
                    <option key={r.id} value={r.id}>{r.icon} {r.label}</option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[--color-muted]">
                  <IconChevronDown />
                </span>
              </div>
            </Field>

            <Field label="Ciudad" error={errors.ciudad?.message}>
              <div className="relative">
                <select
                  {...register('ciudad')}
                  className={cn(selectCls(!!errors.ciudad), 'appearance-none pr-10')}
                  defaultValue=""
                >
                  <option value="" disabled>¿Dónde te encontrás?</option>
                  {ciudades.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[--color-muted]">
                  <IconChevronDown />
                </span>
              </div>
            </Field>

            <Field label="Barrio / Zona" error={errors.barrio?.message}>
              <input
                {...register('barrio')}
                type="text"
                placeholder="Ej: El Cruce, Melipal, Centro"
                className={inputCls(!!errors.barrio)}
              />
            </Field>
          </div>

          {/* Sección: Experiencia */}
          <Field label="Tu experiencia" error={errors.bio?.message}>
            <textarea
              {...register('bio')}
              rows={4}
              placeholder="Detallá tus años en el oficio, herramientas o certificaciones..."
              className={cn(inputCls(!!errors.bio), 'resize-none py-4 h-auto')}
            />
          </Field>

          {/* CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-[0px_20px_40px_rgba(0,0,0,0.4)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #3de273 0%, #19ce61 100%)',
                color: '#003915',
                fontFamily: 'var(--font-display)',
              }}
            >
              {isSubmitting ? 'Creando perfil…' : 'Crear mi perfil'}
              {!isSubmitting && <IconChevronRight />}
            </button>
          </div>

        </form>

        {/* Footer legal */}
        <p className="text-xs text-[--color-muted] text-center mt-8 tracking-wide uppercase">
          Al registrarte aceptás los{' '}
          <span className="text-[--color-nieve] hover:text-[--color-bosque-lt] cursor-pointer transition-colors">
            Términos y Condiciones
          </span>
        </p>
      </main>
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: '#adcec0' }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs font-semibold" style={{ color: '#ffb4ab' }}>{error}</p>
      )}
    </div>
  )
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return cn(
    'w-full h-14 px-4 rounded-xl bg-[#090f14] text-[--color-nieve] placeholder:text-[#414845] transition-shadow',
    'focus:outline-none focus:ring-1 focus:ring-[rgba(173,206,192,0.4)]',
    hasError ? 'ring-1 ring-[#ffb4ab]/60' : '',
  )
}

function selectCls(hasError: boolean) {
  return inputCls(hasError)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function IconChevronDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
