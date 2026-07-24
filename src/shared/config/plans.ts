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
