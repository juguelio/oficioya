import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import { useAuth } from '@/hooks/useAuth'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

type FormData = z.infer<typeof schema>

// ─── ProviderLogin ────────────────────────────────────────────────────────────

export function ProviderLogin() {
  const navigate          = useNavigate()
  const { signIn }        = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setAuthError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setAuthError(
        error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : error.message,
      )
      return
    }
    // TODO: redirect to /dashboard once it exists
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col text-[--color-nieve]" style={{ backgroundColor: '#0e1419' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 backdrop-blur-xl flex items-center px-6 h-16 gap-4"
        style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-[--color-bosque-lt] hover:bg-white/5 transition-all active:scale-95"
          aria-label="Volver"
        >
          <IconArrowLeft />
        </button>
        <h1
          className="font-bold text-base text-[--color-nieve]"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          Iniciar sesión
        </h1>
      </header>

      <main className="flex-1 flex flex-col justify-center pt-16 pb-24 px-6 max-w-xl mx-auto w-full">

        <div className="mb-10">
          <h2
            className="text-3xl font-bold text-[--color-nieve] mb-2"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            Bienvenido de vuelta
          </h2>
          <p className="text-sm text-[--color-muted]">Ingresá para gestionar tu perfil y contactos.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          <Field label="Email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="tu@email.com"
              className={inputCls(!!errors.email)}
              autoComplete="email"
            />
          </Field>

          <Field label="Contraseña" error={errors.password?.message}>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                className={cn(inputCls(!!errors.password), 'pr-12')}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[--color-muted] hover:text-[--color-nieve] transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </Field>

          {authError && (
            <div
              className="px-4 py-3 rounded-[--radius-lg] text-sm font-semibold"
              style={{ backgroundColor: '#ffb4ab18', color: '#ffb4ab', border: '1px solid #ffb4ab30' }}
            >
              {authError}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-[--radius-full] font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: '#4A8C49', color: '#fff' }}
            >
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
              {!isSubmitting && <IconArrowRight />}
            </button>
          </div>

          <p className="text-xs text-center text-[--color-muted] pt-2">
            ¿Todavía no tenés perfil?{' '}
            <Link to="/registro/prestador" className="text-[--color-bosque-lt] font-semibold hover:underline">
              Registrate
            </Link>
          </p>
        </form>
      </main>
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

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
