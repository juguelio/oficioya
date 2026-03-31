export type SubscriptionPlan = {
  id: 'basico' | 'profesional' | 'destacado'
  label: string
  priceARS: number
  contactsPerMonth: number | 'unlimited'
  hasBadge: boolean
  priority: 'normal' | 'alta' | 'maxima'
}
