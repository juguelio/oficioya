// Fuente única de los planes de suscripción (§5, §7).
// Antes el precio estaba duplicado en PricingPage, ConversationalOnboarding y
// ProviderSignup, más "$20.000/mes" suelto en el copy de HomePage: un ajuste por
// inflación tocaba 4 archivos. Ahora el precio vive únicamente acá.
// Vive en shared/ porque tres features/páginas distintas lo consumen y una feature
// no puede importar de otra (§3).

export type SubscriptionPlan = {
  id: 'basico' | 'profesional' | 'destacado'
  label: string
  priceARS: number
  contactsPerMonth: number | 'unlimited'
  hasBadge: boolean
  priority: 'normal' | 'alta' | 'maxima'
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: 'basico',      label: 'Básico',      priceARS: 20000, contactsPerMonth: 8,           hasBadge: false, priority: 'normal' },
  { id: 'profesional', label: 'Profesional', priceARS: 35000, contactsPerMonth: 'unlimited', hasBadge: true,  priority: 'alta' },
  { id: 'destacado',   label: 'Destacado',   priceARS: 55000, contactsPerMonth: 'unlimited', hasBadge: true,  priority: 'maxima' },
]

// Plan base ("desde") — el más barato. Alimenta el copy de HomePage vía formatARS().
export const BASE_PLAN: SubscriptionPlan = SUBSCRIPTION_PLANS.reduce(
  (cheapest, plan) => (plan.priceARS < cheapest.priceARS ? plan : cheapest),
)

// ─── Promesa de lanzamiento ───────────────────────────────────────────────────
// Hoy no se cobra: `useSubscription` está apagado y /planes no invoca el checkout.
// Esto es lo que le prometemos al prestador mientras dure eso, y tiene que decir
// LO MISMO en los tres lugares donde aparece (home, /planes, /activar) y en el
// guion de ops/outreach. Alguien a quien llamaste por teléfono recorre las tres
// superficies en veinte minutos: si dicen cosas distintas, parece letra chica.
// Decisión 2026-08-07: sin fecha fija de corte. Un plazo inventado se vence solo
// y te obliga a cobrarle a alguien a quien todavía no le trajiste un cliente.

export const LANZAMIENTO = {
  /** Titular corto. Para chips, stats y encabezados. */
  titulo: 'Gratis mientras arrancamos',
  /** La promesa completa. Es la que hay que poder sostener por teléfono. */
  promesa:
    'No cobramos nada mientras estamos arrancando. Cuando empecemos a cobrar te avisamos ' +
    'con 30 días de anticipación — y si Oficio no te trajo trabajo, no tenés nada que pagar.',
  /** Una línea, para donde no entra la promesa completa. */
  corta: 'Gratis mientras arrancamos. Avisamos con 30 días antes de cobrar.',
  avisoDias: 30,
} as const
