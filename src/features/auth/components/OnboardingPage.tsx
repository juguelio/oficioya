import { useNavigate } from 'react-router-dom'
import { Logo } from '@/shared/components'

// ─── OnboardingPage ───────────────────────────────────────────────────────────

export function OnboardingPage() {
  const navigate = useNavigate()

  return (
    <div
      className="relative min-h-screen flex flex-col text-[--color-nieve]"
      style={{ backgroundColor: 'var(--color-noche)' }}
    >

      {/* ── Logo ─────────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-center pt-12 pb-8">
        <Logo size={48} withWordmark />
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-grow px-6 pb-12 flex flex-col w-full max-w-md mx-auto">

        {/* Hero copy */}
        <div className="mb-10">
          <h2
            className="text-3xl font-bold leading-tight text-[--color-nieve] mb-3"
            style={{ letterSpacing: '-0.025em' }}
          >
            Tu nexo con el <br />
            <span style={{ color: 'var(--color-bosque-lt)' }}>talento local.</span>
          </h2>
          <p className="text-base text-[--color-muted] leading-relaxed">
            Elegí cómo querés empezar a potenciar tu zona.
          </p>
        </div>

        {/* Role cards */}
        <div className="space-y-4 mb-12">

          {/* Card: Cliente */}
          <RoleCard
            icon={<IconSearch />}
            iconBg="var(--color-noche)"
            iconColor="var(--color-nieve)"
            title="Necesito un profesional"
            description="Encontrá electricistas, plomeros y más cerca tuyo con la confianza de nuestra red."
            cardBg="var(--color-sombra)"
            borderColor="var(--color-line)"
            cta={
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-6 rounded-full border font-bold text-sm tracking-wide text-[--color-nieve] transition-colors active:scale-[0.98]"
                style={{ borderColor: 'var(--color-line)' }}
              >
                Buscar ahora
              </button>
            }
          />

          {/* Card: Prestador */}
          <RoleCard
            icon={<IconBuild />}
            iconBg="var(--color-bosque-dk)"
            iconColor="var(--color-bosque-lt)"
            title="Soy prestador"
            description="Sumá tu perfil, mostrá tu trabajo y conseguí más clientes en tu zona hoy mismo."
            cardBg="var(--color-sombra)"
            borderColor="var(--color-line)"
            glow
            cta={
              <button
                onClick={() => navigate('/registro/prestador')}
                className="w-full py-3 px-6 rounded-full font-bold text-sm tracking-wide active:brightness-90 transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--color-bosque-lt)',
                  color: '#fff',
                }}
              >
                Registrarme
              </button>
            }
          />

        </div>

        {/* Footer */}
        <footer className="mt-auto text-center space-y-8">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-[--color-muted] hover:text-[--color-nieve] transition-colors"
          >
            ¿Ya tenés cuenta?{' '}
            <span className="font-bold ml-1" style={{ color: 'var(--color-bosque-lt)' }}>
              Ingresá
            </span>
          </button>
        </footer>

      </main>
    </div>
  )
}

// ─── RoleCard ─────────────────────────────────────────────────────────────────

type RoleCardProps = {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  description: string
  cardBg: string
  borderColor: string
  glow?: boolean
  cta: React.ReactNode
}

function RoleCard({ icon, iconBg, iconColor, title, description, cardBg, borderColor, glow, cta }: RoleCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 active:scale-[0.98]"
      style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
    >
      {/* Glow accent for prestador card */}
      {glow && (
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: 'rgba(30,111,165,0.1)' }}
        />
      )}

      <div className="relative z-10">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[--color-nieve] mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[--color-muted] mb-6 leading-relaxed">
          {description}
        </p>

        {/* CTA */}
        {cta}
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function IconBuild() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}
