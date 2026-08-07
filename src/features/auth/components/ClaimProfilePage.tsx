import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { signUpErrorMessage } from '@/lib/auth-signup'
import { ciudades, rubros } from '@/design-system/tokens'
import { LANZAMIENTO } from '@/shared/config/plans'

// ─── Tipos del RPC ──────────────────────────────────────────────────────────────
type Claimable = {
  id: string
  name: string
  rubro_id: string
  ciudad_id: string
  whatsapp_number: string | null
  external_rating: number | null
  external_reviews: number | null
  status: string
  already_claimed: boolean
}

const schema = z.object({
  email:    z.string().email('Revisá el email'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  whatsapp: z.string().min(8, 'Ingresá tu WhatsApp'),
})
type FormData = z.infer<typeof schema>

const INPUT_CLASS =
  'w-full h-14 px-4 rounded-lg text-nieve placeholder:text-muted border ' +
  'focus:outline-none focus:ring-1 focus:ring-bosque-lt/40'

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 px-8 text-center bg-noche">
      {children}
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold uppercase tracking-[0.15em] mb-2 text-muted">{label}</label>
      {children}
      {error && <p className="text-xs mt-1.5" style={{ color: '#ffb4ab' }}>{error}</p>}
    </div>
  )
}

// ─── ClaimProfilePage — /activar/:id ──────────────────────────────────────────────
export function ClaimProfilePage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const { signUp } = useAuth()
  // token en el fragment (#t=...): no viaja al server (Referer/logs) ni a PostHog
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('t')

  const [profile, setProfile]     = useState<Claimable | null | undefined>(undefined) // undefined = cargando
  const [submitError, setSubmitError] = useState<string | null>(null)
  // 'session' → ya está adentro; 'confirm' → falta confirmar el mail
  const [done, setDone]           = useState<'session' | 'confirm' | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!token) { setProfile(null); return }
      const { data } = await supabase.rpc('get_claimable_by_token', { p_token: token })
      if (cancelled) return
      const p = (data as unknown as Claimable | null)
      setProfile(p)
      if (p?.whatsapp_number) setValue('whatsapp', p.whatsapp_number)
    })()
    return () => { cancelled = true }
  }, [token, setValue])

  async function onSubmit(data: FormData) {
    if (!token) return
    setSubmitError(null)

    const { data: authData, error } = await signUp(data.email, data.password, {
      claim_token:     token,
      whatsapp_number: data.whatsapp,
    })

    // El trigger aborta el alta si el token ya se usó → Supabase lo devuelve como
    // error genérico de base. Traducimos para no mostrar el texto crudo.
    if (error && /database error|claim_token/i.test(error.message)) {
      setSubmitError('Este link ya fue usado o venció. Escribinos y te mandamos uno nuevo.')
      return
    }

    const message = signUpErrorMessage(error, authData)
    if (message) { setSubmitError(message); return }

    setDone(authData.session ? 'session' : 'confirm')
  }

  if (profile === undefined) return <Center><p className="text-muted">Cargando…</p></Center>

  if (!profile) return (
    <Center>
      <span className="text-5xl mb-3">🔗</span>
      <p className="text-nieve font-bold text-lg">Link inválido o vencido</p>
      <p className="text-muted text-sm">Revisá el enlace que te enviamos por WhatsApp.</p>
    </Center>
  )

  // Cuenta creada recién
  if (done) return (
    <Center>
      <span className="text-6xl mb-4">🎉</span>
      <h1 className="font-black text-2xl text-nieve mb-2" style={{ letterSpacing: '-0.02em' }}>
        ¡Tu perfil está activo!
      </h1>
      <p className="text-sm text-muted mb-7 max-w-xs">
        {done === 'session'
          ? 'Ya podés recibir contactos de clientes. Desde tu panel editás tus datos y prendés el modo guardia.'
          : 'Te mandamos un mail para confirmar tu cuenta. Confirmalo y entrá a tu panel.'}
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate(done === 'session' ? '/dashboard' : '/login')}
          className="w-full py-3.5 rounded-full font-bold text-sm text-white active:scale-95 transition-all bg-bosque-lt"
        >
          {done === 'session' ? 'Ir a mi panel' : 'Ir a iniciar sesión'}
        </button>
        <button
          onClick={() => navigate(`/prestador/${profile.id}`)}
          className="w-full py-3 rounded-full font-bold text-sm border active:scale-95 transition-all border-line text-nieve"
        >
          Ver cómo me ven los clientes
        </button>
      </div>
    </Center>
  )

  // El perfil ya tiene dueño — no ofrecemos crear cuenta encima
  if (profile.already_claimed) return (
    <Center>
      <span className="text-5xl mb-3">✅</span>
      <p className="text-nieve font-bold text-lg mb-1">Este perfil ya tiene cuenta</p>
      <p className="text-muted text-sm mb-7 max-w-xs">Si es tuyo, entrá con tu email y contraseña.</p>
      <button
        onClick={() => navigate('/login')}
        className="py-3.5 px-8 rounded-full font-bold text-sm text-white active:scale-95 transition-all bg-bosque-lt"
      >
        Iniciar sesión
      </button>
    </Center>
  )

  const rubroData  = rubros.find(r => r.id === profile.rubro_id)
  const ciudadData = ciudades.find(c => c.id === profile.ciudad_id)

  return (
    <div className="min-h-screen text-nieve bg-noche">
      <header
        className="fixed top-0 w-full z-50 flex items-center px-6 h-16 border-b border-line bg-noche"
      >
        <h1 className="font-black text-base" style={{ letterSpacing: '-0.02em' }}>Activá tu perfil</h1>
      </header>

      <main className="pt-16 pb-10 max-w-xl mx-auto px-6">
        <div className="pt-8 text-center">
          <span className="text-5xl mb-4 inline-block">👋</span>
          <h2 className="text-2xl font-black mb-2" style={{ letterSpacing: '-0.02em' }}>
            Te armamos tu perfil en Oficio
          </h2>
          <p className="text-sm text-muted mb-4 max-w-sm mx-auto">
            Creá tu clave para administrarlo y empezá a recibir contactos de clientes de la zona.
          </p>
          {/* La misma promesa que escuchó por teléfono y que va a leer en /planes.
              Acá es donde decide: si «gratis» no dice hasta cuándo, suena a trampa. */}
          <div className="mb-7 mx-auto max-w-sm px-4 py-3 rounded-lg border bg-brand-tint border-bosque-lt text-left">
            <p className="text-xs font-bold mb-1 text-bosque-lt">{LANZAMIENTO.titulo}</p>
            <p className="text-xs leading-relaxed text-bosque-lt">{LANZAMIENTO.promesa}</p>
          </div>
        </div>

        {/* Tarjeta del perfil pre-armado */}
        <div className="rounded-xl p-5 mb-7 border bg-sombra border-line">
          <p className="text-lg font-bold text-nieve">{profile.name}</p>
          <p className="text-sm text-bosque-lt font-semibold mt-0.5">
            {rubroData?.icon} {rubroData?.label} · <span className="text-muted font-normal">{ciudadData?.label}</span>
          </p>
          {profile.external_rating != null && (
            <p className="text-xs text-muted mt-2">
              ★ {Number(profile.external_rating).toFixed(1)} en Google
              {profile.external_reviews ? ` (${profile.external_reviews} reseñas)` : ''}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Field label="Tu WhatsApp" error={errors.whatsapp?.message}>
            <input
              {...register('whatsapp')}
              placeholder="+549..."
              inputMode="tel"
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--color-noche)', borderColor: errors.whatsapp ? '#ffb4ab' : 'var(--color-line)' }}
            />
          </Field>

          <Field label="Tu email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="tunombre@mail.com"
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--color-noche)', borderColor: errors.email ? '#ffb4ab' : 'var(--color-line)' }}
            />
          </Field>

          <Field label="Creá una contraseña" error={errors.password?.message}>
            <input
              {...register('password')}
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className={INPUT_CLASS}
              style={{ backgroundColor: 'var(--color-noche)', borderColor: errors.password ? '#ffb4ab' : 'var(--color-line)' }}
            />
          </Field>

          {submitError && <p className="text-sm text-center mb-4" style={{ color: '#ffb4ab' }}>{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-full font-bold text-white text-base active:scale-[0.98] transition-transform disabled:opacity-60 bg-bosque-lt"
          >
            {isSubmitting ? 'Activando…' : 'Sí, soy yo — activar mi perfil'}
          </button>
          <p className="text-center text-xs text-muted mt-4">
            Al activar, confirmás que sos el titular y aceptás recibir contactos por WhatsApp.
          </p>
        </form>
      </main>
    </div>
  )
}
