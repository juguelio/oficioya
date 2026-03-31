import { useNavigate } from 'react-router-dom'

const HERO_IMG = '/images/onboarding-mountains.png'

// ─── OnboardingPage ───────────────────────────────────────────────────────────

export function OnboardingPage() {
  const navigate = useNavigate()

  return (
    <div
      className="relative min-h-screen flex flex-col text-[--color-nieve]"
      style={{ backgroundColor: '#0e1419' }}
    >

      {/* ── Background: mountain silhouette ──────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-20">
        <img
          src={HERO_IMG}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
          style={{ filter: 'grayscale(1) brightness(0.5)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, #0e1419 0%, transparent 50%, #0e1419 100%)',
          }}
        />
      </div>

      {/* ── Bottom fade ──────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 w-full h-32 pointer-events-none z-0"
        style={{ background: 'linear-gradient(to top, #0e1419, transparent)' }}
      />

      {/* ── Logo ─────────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-center pt-12 pb-8">
        <h1
          className="text-4xl font-black text-[--color-nieve] tracking-tighter"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
        >
          OFICIO
        </h1>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-grow px-6 pb-12 flex flex-col w-full max-w-md mx-auto">

        {/* Hero copy */}
        <div className="mb-10">
          <h2
            className="text-3xl font-bold leading-tight text-[--color-nieve] mb-3"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.025em' }}
          >
            Tu nexo con el <br />
            <span style={{ color: '#3de273' }}>talento local.</span>
          </h2>
          <p className="text-base text-[--color-muted] leading-relaxed">
            Elegí cómo querés empezar a potenciar tu comunidad en la Patagonia.
          </p>
        </div>

        {/* Role cards */}
        <div className="space-y-4 mb-12">

          {/* Card: Cliente */}
          <RoleCard
            icon={<IconSearch />}
            iconBg="#2b4963"
            iconColor="#abcae8"
            title="Necesito un profesional"
            description="Encontrá electricistas, plomeros y más cerca tuyo con la confianza de nuestra red."
            cardBg="#1a2026"
            borderColor="rgba(65,72,69,0.15)"
            cta={
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-6 rounded-full border font-bold text-sm tracking-wide text-[--color-nieve] hover:bg-[#252b30] transition-colors active:scale-[0.98]"
                style={{ borderColor: '#8b928e' }}
              >
                Buscar ahora
              </button>
            }
          />

          {/* Card: Prestador */}
          <RoleCard
            icon={<IconBuild />}
            iconBg="#005121"
            iconColor="#3de273"
            title="Soy prestador"
            description="Sumá tu perfil, mostrá tu trabajo y conseguí más clientes en tu zona hoy mismo."
            cardBg="#252b30"
            borderColor="rgba(61,226,115,0.2)"
            glow
            cta={
              <button
                onClick={() => navigate('/registro/prestador')}
                className="w-full py-3 px-6 rounded-full font-bold text-sm tracking-wide active:brightness-90 transition-all active:scale-[0.98] shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #3de273 0%, #19ce61 100%)',
                  color: '#003915',
                  boxShadow: '0 4px 24px rgba(61,226,115,0.12)',
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
            <span className="font-bold ml-1" style={{ color: '#3de273' }}>
              Ingresá
            </span>
          </button>

          {/* Decorative mountain divider */}
          <div className="flex justify-center items-center opacity-30 pt-2">
            <div className="h-px w-12 bg-[#414845]" />
            <span className="mx-4 text-[--color-muted]">
              <IconMountain />
            </span>
            <div className="h-px w-12 bg-[#414845]" />
          </div>
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
          style={{ backgroundColor: 'rgba(61,226,115,0.1)' }}
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
        <h3
          className="text-xl font-bold text-[--color-nieve] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
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

function IconMountain() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  )
}
