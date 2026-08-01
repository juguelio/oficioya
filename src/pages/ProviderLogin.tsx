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
  const { signIn, signInWithGoogle } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setAuthError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      // Los mensajes crudos de Supabase vienen en inglés y no dicen qué hacer.
      // El caso que más confunde: te registraste con Google y después intentás
      // entrar con contraseña — esa cuenta no tiene una, y Supabase responde el
      // mismo "Invalid login credentials" que para una contraseña mal escrita
      // (a propósito, para no revelar qué cuentas existen). El copy cubre los dos.
      const raw = error.message.toLowerCase()
      setAuthError(
        raw.includes('email not confirmed')
          ? 'Te falta confirmar tu email. Buscá el mail que te mandamos y tocá el link.'
        : raw.includes('invalid login credentials')
          ? 'Ese email y contraseña no coinciden. Revisalos — y si te registraste con Google, entrá con «Continuar con Google» acá arriba.'
        : error.message,
      )
      return
    }
    navigate('/dashboard')
  }

  async function handleGoogleSignIn() {
    setAuthError(null)
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setAuthError('No pudimos iniciar sesión con Google. Probá de nuevo o usá tu email y contraseña.')
      setGoogleLoading(false)
    }
    // Si no hay error, Supabase redirige fuera de la app al selector de Google.
  }

  return (
    <div className="min-h-screen flex flex-col text-[--color-nieve]" style={{ backgroundColor: 'var(--color-noche)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 flex items-center px-5 h-14 gap-3 border-b"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-[--color-bosque-lt] hover:bg-black/5 transition-all active:scale-95"
          aria-label="Volver"
        >
          <IconArrowLeft />
        </button>
        <h1
          className="font-bold text-base text-[--color-nieve]"
          style={{ letterSpacing: '-0.02em' }}
        >
          Iniciar sesión
        </h1>
      </header>

      <main className="flex-1 flex flex-col justify-center pt-14 pb-24 px-6 max-w-xl mx-auto w-full">

        <div className="mb-10">
          <h2
            className="text-3xl font-bold text-[--color-nieve] mb-2"
            style={{ letterSpacing: '-0.02em' }}
          >
            Bienvenido de vuelta
          </h2>
          <p className="text-sm text-[--color-muted]">Ingresá para gestionar tu perfil y contactos.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isSubmitting}
            className="w-full h-14 rounded-[--radius-full] font-bold text-base flex items-center justify-center gap-3 border transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-sombra)', color: 'var(--color-nieve)', borderColor: 'var(--color-line)' }}
          >
            <GoogleIcon />
            {googleLoading ? 'Abriendo Google…' : 'Continuar con Google'}
          </button>

          <div className="flex items-center gap-3 py-1" aria-hidden="true">
            <div className="h-px flex-1 bg-[--color-line]" />
            <span className="text-[10px] font-bold tracking-[0.14em] text-[--color-muted]">O CON EMAIL</span>
            <div className="h-px flex-1 bg-[--color-line]" />
          </div>

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
              style={{ backgroundColor: 'var(--color-bosque-lt)', color: '#fff' }}
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
      <label className="text-xs font-bold tracking-[0.12em] uppercase text-[--color-muted]">
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
    'w-full h-14 px-4 rounded-xl text-[--color-nieve]',
    'bg-[--color-sombra] border border-[--color-line]',
    'placeholder:text-[--color-muted]/60 transition-shadow',
    'focus:outline-none focus:ring-1 focus:ring-[--color-bosque-lt]/40',
    hasError ? 'ring-1 ring-[#ffb4ab]/60 border-[#ffb4ab]/40' : '',
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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.8 12.23c0-.71-.06-1.23-.2-1.77H12v3.45h5.64c-.11.86-.72 2.16-2.08 3.03l-.02.12 3.02 2.34.21.02c1.92-1.77 3.03-4.37 3.03-7.19Z" />
      <path fill="#34A853" d="M12 22c2.76 0 5.08-.91 6.77-2.48l-3.22-2.49c-.86.6-2.02 1.02-3.55 1.02a6.14 6.14 0 0 1-5.8-4.24l-.11.01-3.14 2.43-.04.11A10.22 10.22 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.2 13.81A6.3 6.3 0 0 1 5.86 12c0-.63.12-1.24.33-1.81v-.13L2.99 7.6l-.1.05A10.2 10.2 0 0 0 1.8 12c0 1.55.37 3.02 1.09 4.35l3.31-2.54Z" />
      <path fill="#EA4335" d="M12 5.95c1.93 0 3.23.84 3.97 1.54l2.9-2.83C17.07 2.98 14.76 2 12 2a10.22 10.22 0 0 0-9.11 5.65l3.3 2.54A6.16 6.16 0 0 1 12 5.95Z" />
    </svg>
  )
}
