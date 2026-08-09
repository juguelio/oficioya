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
//
// Decisión 2026-08-07: 60 días con cupo de 30 fundadores. El plazo y el cupo dan
// urgencia en la llamada; la segunda promesa —no cobrar si no le trajimos
// trabajo— es la que evita el problema del plazo fijo, que es que el reloj corre
// igual aunque el prestador no haya visto un solo cliente.
//
// El cupo NO se muestra como contador ("quedan N lugares"): con 2 prestadores
// activos, un contador honesto anuncia que no se sumó nadie.

export const LANZAMIENTO = {
  /** Titular corto. Para chips, stats y encabezados. */
  titulo: 'Gratis 60 días para los primeros 30',
  /** La promesa completa. Es la que hay que poder sostener por teléfono. */
  promesa:
    'Estamos armando el listado: los primeros 30 prestadores no pagan nada durante ' +
    '60 días desde que activan el perfil. Y si en esos 60 días Oficio no te trajo ' +
    'trabajo, no tenés nada que pagar.',
  /** Una línea, para donde no entra la promesa completa. */
  corta: 'Gratis 60 días para los primeros 30 prestadores.',
  dias: 60,
  cupo: 30,
} as const
