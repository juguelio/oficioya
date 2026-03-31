import { useNavigate, Link } from 'react-router-dom'
import { formatARS } from '@/shared/utils/formatARS'
import { cn } from '@/shared/utils/cn'
import type { SubscriptionPlan } from '@/features/subscriptions/types'

const plans: SubscriptionPlan[] = [
  {
    id: 'basico',
    label: 'Básico',
    priceARS: 20000,
    contactsPerMonth: 8,
    hasBadge: false,
    priority: 'normal',
  },
  {
    id: 'profesional',
    label: 'Profesional',
    priceARS: 35000,
    contactsPerMonth: 'unlimited',
    hasBadge: true,
    priority: 'alta',
  },
  {
    id: 'destacado',
    label: 'Destacado',
    priceARS: 55000,
    contactsPerMonth: 'unlimited',
    hasBadge: true,
    priority: 'maxima',
  },
]

const planMeta: Record<SubscriptionPlan['id'], { tagline: string; features: string[] }> = {
  basico: {
    tagline: 'Para empezar a recibir contactos.',
    features: [
      '8 contactos por mes',
      'Perfil público en la plataforma',
      'Reseñas de clientes',
    ],
  },
  profesional: {
    tagline: 'Para crecer con visibilidad real.',
    features: [
      'Contactos ilimitados',
      'Badge ✓ verificado',
      'Prioridad alta en resultados',
      'Reseñas de clientes',
    ],
  },
  destacado: {
    tagline: 'Máxima exposición, sin límites.',
    features: [
      'Contactos ilimitados',
      'Badge ✓ verificado',
      'Prioridad máxima + banner',
      'Aparecés primero en búsquedas',
      'Reseñas de clientes',
    ],
  },
}

// ─── PricingPage ──────────────────────────────────────────────────────────────

export function PricingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen text-[--color-nieve]" style={{ backgroundColor: '#0e1419' }}>

      {/* ── TopAppBar ──────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 backdrop-blur-xl shadow-2xl shadow-black/40 flex items-center justify-between px-6 h-16"
        style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-[--color-bosque-lt] hover:bg-white/5 transition-colors active:scale-95 p-2 rounded-xl"
            aria-label="Volver"
          >
            <IconArrowLeft />
          </button>
          <span
            className="font-bold text-xl text-[--color-nieve]"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
          >
            OFICIO
          </span>
        </div>
        <Link
          to="/"
          className="text-xs font-semibold text-[--color-muted] hover:text-[--color-nieve] transition-colors"
        >
          Soy cliente →
        </Link>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-xl mx-auto">

        {/* ── Hero ───────────────────────────────────────────────────────────────── */}
        <section className="mb-10">
          <p className="text-xs font-bold tracking-[0.15em] text-[--color-bosque-lt] uppercase mb-3">
            Para profesionales
          </p>
          <h1
            className="text-5xl font-black text-[--color-nieve] leading-[1.05] mb-4"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
          >
            Elegí tu<br />plan
          </h1>
          <p className="text-sm text-[--color-muted] leading-relaxed max-w-sm">
            Publicá tu perfil y empezá a recibir clientes en tu ciudad.
            Precios en pesos, sin costos ocultos.
          </p>
        </section>

        {/* ── Plan cards ─────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={() => navigate('/registrarme')}
            />
          ))}
        </div>

        {/* ── Footer note ────────────────────────────────────────────────────────── */}
        <p className="text-xs text-[--color-muted] text-center mt-8 leading-relaxed">
          Precios en ARS · Se actualizan cada 3 meses según inflación.
          <br />
          Podés cambiar o cancelar en cualquier momento.
        </p>

        {/* ── FAQ strip ──────────────────────────────────────────────────────────── */}
        <div className="mt-10 space-y-3">
          {[
            { q: '¿Cómo me pagan?', a: 'Transferencia bancaria o Mercado Pago. Te contactamos al registrarte.' },
            { q: '¿Puedo cambiar de plan?', a: 'Sí, en cualquier momento desde tu perfil. El cambio aplica al próximo ciclo.' },
            { q: '¿Qué pasa si cancelo?', a: 'Tu perfil queda visible hasta el fin del período pagado, luego se desactiva.' },
          ].map(({ q, a }) => (
            <details
              key={q}
              className="rounded-[--radius-xl] p-4 group cursor-pointer"
              style={{ backgroundColor: '#1a2026' }}
            >
              <summary className="list-none flex items-center justify-between text-sm font-semibold text-[--color-nieve] select-none">
                {q}
                <span className="text-[--color-bosque-lt] text-lg leading-none group-open:rotate-45 transition-transform inline-block">+</span>
              </summary>
              <p className="mt-3 text-sm text-[--color-muted] leading-relaxed">{a}</p>
            </details>
          ))}
        </div>

      </main>

      {/* ── Bottom Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 backdrop-blur-xl z-50 rounded-t-xl shadow-[0_-10px_40px_rgba(0,0,0,0.4)]"
        style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
      >
        <NavTab icon={<IconExplore />} label="Explorar" onClick={() => navigate('/')} />
        <NavTab icon={<IconSearch />}  label="Buscar" />
        <NavTab icon={<IconHandyman />} label="Reservas" />
        <NavTab icon={<IconPerson />} label="Prestador" active />
      </nav>

    </div>
  )
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, onSelect }: { plan: SubscriptionPlan; onSelect: () => void }) {
  const isDestacado   = plan.id === 'destacado'
  const isProfesional = plan.id === 'profesional'
  const meta          = planMeta[plan.id]

  return (
    <div
      className={cn(
        'rounded-[--radius-xl] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30',
      )}
      style={isDestacado ? {
        backgroundColor: '#1a2026',
        border: '1px solid transparent',
        background: 'linear-gradient(#1a2026, #1a2026) padding-box, linear-gradient(135deg, #F5C842 0%, #4A8C49 100%) border-box',
      } : {
        backgroundColor: '#1a2026',
        border: `1px solid ${isProfesional ? 'rgba(74,140,73,0.4)' : '#1E2E1E'}`,
      }}
    >
      {/* Plan label + badge */}
      <div className="flex items-center gap-2 mb-4">
        <p className="text-xs font-bold tracking-[0.15em] text-[--color-muted] uppercase">
          {plan.label}
        </p>
        {isDestacado && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: '#F5C842', color: '#0e1419' }}
          >
            Popular
          </span>
        )}
        {isProfesional && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-white"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
            Recomendado
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mb-1">
        <span
          className="text-4xl font-bold text-[--color-nieve]"
          style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
        >
          {formatARS(plan.priceARS)}
        </span>
        <span className="text-xs text-[--color-muted] ml-2">/ mes</span>
      </div>
      <p className="text-xs text-[--color-muted] mb-6">{meta.tagline}</p>

      {/* Separator */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ backgroundColor: '#2A3A2A' }} />
        <span className="text-[10px] font-bold tracking-widest text-[--color-muted] uppercase">Incluye</span>
        <div className="flex-1 h-px" style={{ backgroundColor: '#2A3A2A' }} />
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6">
        {meta.features.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <span className="text-[--color-bosque-lt] font-bold leading-none mt-0.5 flex-shrink-0">✓</span>
            <span className="text-[--color-nieve]">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onSelect}
        className={cn(
          'w-full py-3.5 rounded-full font-bold text-sm transition-all active:scale-[0.98] shadow-lg',
          isDestacado || isProfesional
            ? 'text-white'
            : 'text-[--color-nieve] border',
        )}
        style={
          isDestacado
            ? { background: 'linear-gradient(135deg, #F5C842 0%, #4A8C49 100%)' }
            : isProfesional
            ? { background: 'var(--color-bosque-lt)' }
            : { backgroundColor: '#252b30', borderColor: '#2A3A2A' }
        }
      >
        Empezar con {plan.label}
      </button>
    </div>
  )
}

// ─── NavTab ───────────────────────────────────────────────────────────────────

type NavTabProps = { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }

function NavTab({ icon, label, active = false, onClick }: NavTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all active:scale-90 duration-150',
        active ? 'text-[--color-bosque-lt]' : 'text-[--color-muted] hover:text-[--color-bosque-lt]',
      )}
      style={active ? { backgroundColor: '#1a2026' } : undefined}
    >
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">{label}</span>
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function IconExplore() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function IconHandyman() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function IconPerson() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
