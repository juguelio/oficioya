import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Logo } from '@/shared/components'
import { cn } from '@/shared/utils/cn'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

type Role = 'cliente' | 'prestador'

// ─── RegisterPage (login) ─────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate           = useNavigate()
  const [role, setRole]    = useState<Role>('cliente')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(_data: FormData) {
    setLoading(true)
    // TODO: Supabase auth — replace with real sign-in
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-noche)' }}>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 h-14 border-b"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-black/5 active:scale-95 transition-all" aria-label="Volver">
          <IconArrowLeft />
        </button>
        <Logo size={24} withWordmark />
        <div className="w-10" />
      </header>

      <main className="flex-1 px-5 pt-8 pb-12 max-w-sm mx-auto w-full">

        {/* ── Role tabs ─────────────────────────────────────────────────────────── */}
        <div
          className="flex rounded-xl p-1 mb-8 gap-1"
          style={{ backgroundColor: 'var(--color-line)' }}
          role="tablist"
        >
          {(['cliente', 'prestador'] as Role[]).map(r => (
            <button
              key={r}
              role="tab"
              aria-selected={role === r}
              onClick={() => setRole(r)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] capitalize"
              style={
                role === r
                  ? { backgroundColor: 'var(--color-sombra)', color: 'var(--color-bosque-lt)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: 'var(--color-muted)' }
              }
            >
              {r === 'cliente' ? 'Soy cliente' : 'Soy prestador'}
            </button>
          ))}
        </div>

        {/* ── Headline ──────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="font-black text-2xl mb-1" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.03em' }}>
            {role === 'cliente' ? 'Bienvenido de vuelta' : 'Entrá a tu panel'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {role === 'cliente'
              ? 'Encontrá profesionales verificados cerca tuyo.'
              : 'Gestioná tu perfil y contactos desde acá.'}
          </p>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              className={cn(
                'w-full h-12 px-4 rounded-xl border text-sm transition-all',
                'focus:outline-none focus:ring-2',
                errors.email ? 'border-red-400 focus:ring-red-200' : 'focus:ring-[--color-bosque-lt]/20',
              )}
              style={{
                backgroundColor: 'var(--color-sombra)',
                borderColor: errors.email ? '#f87171' : 'var(--color-line)',
                color: 'var(--color-nieve)',
              }}
            />
            {errors.email && (
              <p className="text-xs font-semibold text-red-500 pt-0.5">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                Contraseña
              </label>
              <button type="button" className="text-xs font-semibold" style={{ color: 'var(--color-bosque-lt)' }}>
                Olvidé mi contraseña
              </button>
            </div>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className={cn(
                'w-full h-12 px-4 rounded-xl border text-sm transition-all',
                'focus:outline-none focus:ring-2',
                errors.password ? 'border-red-400 focus:ring-red-200' : 'focus:ring-[--color-bosque-lt]/20',
              )}
              style={{
                backgroundColor: 'var(--color-sombra)',
                borderColor: errors.password ? '#f87171' : 'var(--color-line)',
                color: 'var(--color-nieve)',
              }}
            />
            {errors.password && (
              <p className="text-xs font-semibold text-red-500 pt-0.5">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

        </form>

        {/* ── Divider ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-line)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>o</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-line)' }} />
        </div>

        {/* ── Social (placeholder para Supabase Google) ─────────────────────────── */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full h-12 rounded-xl border font-semibold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:bg-black/5"
          style={{ borderColor: 'var(--color-line)', color: 'var(--color-nieve)' }}
        >
          <IconGoogle />
          Continuar con Google
        </button>

        {/* ── Footer ────────────────────────────────────────────────────────────── */}
        <p className="text-center text-sm mt-8" style={{ color: 'var(--color-muted)' }}>
          {role === 'cliente' ? (
            <>
              ¿Querés explorar sin cuenta?{' '}
              <button onClick={() => navigate('/')} className="font-bold" style={{ color: 'var(--color-bosque-lt)' }}>
                Ir al inicio
              </button>
            </>
          ) : (
            <>
              ¿No tenés cuenta?{' '}
              <Link to="/registro/prestador" className="font-bold" style={{ color: 'var(--color-bosque-lt)' }}>
                Registrate
              </Link>
            </>
          )}
        </p>

      </main>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: 'var(--color-bosque-lt)' }}
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
