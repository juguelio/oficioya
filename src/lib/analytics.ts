import posthog from 'posthog-js'

// PostHog — analytics de validación (conteo de clics de WhatsApp, ADR-001).
// Si no hay key configurada (dev local sin .env), todo es no-op: nunca rompe.

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'

let enabled = false

export function initAnalytics(): void {
  if (enabled) return
  if (!key) {
    console.warn('[analytics] VITE_POSTHOG_KEY no está configurado — el tracking (ADR-001) es no-op.')
    return
  }
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    persistence: 'localStorage',
  })
  enabled = true
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (!enabled) return
  posthog.capture(event, props)
}
