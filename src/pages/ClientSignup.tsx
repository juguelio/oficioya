import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { signUpErrorMessage } from '@/lib/auth-signup'
import { Logo } from '@/shared/components'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name:     z.string().min(2, 'Ingresá tu nombre'),
  email:    z.string().email('Ese email no parece válido'),
  password: z.string().min(8, 'La contraseña necesita al menos 8 caracteres'),
})

type FormData = z.infer<typeof schema>

// ─── ClientSignup — /registro/cliente ─────────────────────────────────────────
// Cuenta de CLIENTE: opcional, solo sirve para no depender del link privado y
// ver todos tus trabajos juntos. Publicar sigue siendo posible sin cuenta.

export function ClientSignup() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuth()

  const [authError, setAuthError]       = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [checkEmail, setCheckEmail]     = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setAuthError(null)
    // account_type='cliente' es lo que evita que la cuenta se trate como
    // prestador. El trigger de la base no crea fila en providers porque el alta
    // no trae ciudad ni rubro.
    const { data: authData, error } = await signUp(data.email, data.password, {
      name:         data.name,
      account_type: 'cliente',
    })

    const message = signUpErrorMessage(error, authData)
    if (message) { setAuthError(message); return }

    // Con "Confirm email" activo no hay sesión inmediata: hay que confirmar.
    if (authData.session) { navigate('/mis-trabajos'); return }
    setCheckEmail(true)
  }

  async function handleGoogle() {
    setAuthError(null)
    setGoogleLoading(true)
    const { error } = await signInWithGoogle('/mis-trabajos')
    if (error) {
      setAuthError('No pudimos crear tu cuenta con Google. Probá de nuevo o usá tu email.')
      setGoogleLoading(false)
    }
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center" style={{ backgroundColor: 'var(--color-noche)' }}>
        <span className="text-5xl mb-5">📬</span>
        <h2 className="font-black text-2xl mb-2" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
          Revisá tu email
        </h2>
        <p className="text-sm mb-8 max-w-sm" style={{ color: 'var(--color-muted)' }}>
          Te mandamos un link para confirmar tu cuenta. Tocalo y volvé a entrar para ver tus trabajos.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-3 rounded-[--radius-full] font-bold text-sm text-white active:scale-[0.98] transition-all"
          style={{ backgroundColor: 'var(--color-bosque-lt)' }}
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-noche)' }}>

      <header
        className="fixed top-0 w-full z-50 h-14 border-b"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <div className="px-5 h-full flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl text-[--color-bosque-lt] active:scale-95 transition-all"
            aria-label="Volver"
          >
            <IconArrowLeft />
          </button>
          <button onClick={() => navigate('/')} className="active:scale-95 transition-transform" aria-label="Inicio">
            <Logo size={26} withWordmark />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center pt-14 pb-16 px-6 max-w-xl mx-auto w-full">

        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.03em' }}>
            Creá tu cuenta
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Para seguir tus trabajos y los presupuestos que recibís, todo en un lugar.
          </p>
        </div>

        <div
          className="mb-6 px-4 py-3 rounded-[--radius-lg] border text-xs leading-relaxed"
          style={{ backgroundColor: 'var(--color-brand-tint)', borderColor: 'var(--color-bosque-lt)', color: 'var(--color-bosque-lt)' }}
        >
          No es obligatorio: podés <Link to="/trabajos/nuevo" className="font-bold underline">publicar un trabajo sin cuenta</Link> y seguirlo con un link privado.
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          <button
            type="button"
            onClick={handleGoogle}
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

          <Field label="Tu nombre" error={errors.name?.message}>
            <input {...register('name')} type="text" placeholder="Ej: Marcela R." className={inputCls(!!errors.name)} autoComplete="name" />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="tu@email.com" className={inputCls(!!errors.email)} autoComplete="email" />
          </Field>

          <Field label="Contraseña" error={errors.password?.message}>
            <input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" className={inputCls(!!errors.password)} autoComplete="new-password" />
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
              className="w-full h-14 rounded-[--radius-full] font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-bosque-lt)' }}
            >
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </div>

          <p className="text-xs text-center pt-2" style={{ color: 'var(--color-muted)' }}>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--color-bosque-lt)' }}>Ingresá</Link>
          </p>
          <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
            ¿Ofrecés servicios?{' '}
            <Link to="/registro/prestador" className="font-semibold" style={{ color: 'var(--color-bosque-lt)' }}>Registrate como prestador</Link>
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
      <label className="text-xs font-bold tracking-[0.12em] uppercase text-[--color-muted]">{label}</label>
      {children}
      {error && <p className="text-xs font-semibold" style={{ color: '#ffb4ab' }}>{error}</p>}
    </div>
  )
}

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
