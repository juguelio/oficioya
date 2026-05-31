import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import { ciudades, rubros } from '@/design-system/tokens'

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
    <div className="min-h-screen text-[--color-nieve]" style={{ backgroundColor: 'var(--color-noche)' }}>

      {/* ── TopAppBar ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 h-16 border-b border-[--color-line]"
        style={{ backgroundColor: 'var(--color-noche)' }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-black/5 transition-all active:scale-95 text-[--color-bosque-lt]"
          aria-label="Volver"
        >
          <IconArrowLeft />
        </button>
        <h1 className="text-xl font-bold text-[--color-nieve] tracking-tight">
          Registro de prestador
        </h1>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-xl mx-auto">

        {/* ── Intro ──────────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-[--color-nieve] tracking-tight mb-1">
            Unite a la red de Oficio
          </h2>
          <p className="text-sm text-[--color-muted]">Ofrecé tus servicios en tu ciudad.</p>
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
          <div className="rounded-2xl p-6 space-y-5 border border-[--color-line]" style={{ backgroundColor: 'var(--color-sombra)' }}>

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
              className="w-full h-16 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-bosque-lt)',
                color: '#fff',
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
      <label className="text-xs font-bold tracking-[0.12em] uppercase text-[--color-muted]">
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
    'w-full h-14 px-4 rounded-xl text-[--color-nieve] placeholder:text-[--color-muted]/60 transition-shadow border border-[--color-line]',
    'bg-[--color-noche]',
    'focus:outline-none focus:ring-1 focus:ring-[--color-bosque-lt]/40',
    hasError ? 'ring-1 ring-[#ffb4ab]/60 border-[#ffb4ab]/40' : '',
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
