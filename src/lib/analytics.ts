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
    // El token de trabajo viaja en el fragment (#t=...). PostHog captura $current_url
    // (incluye el fragment), así que lo redactamos antes de enviar. Cubre también el
    // formato legacy en query (?t= / &t=).
    sanitize_properties: (props) => {
      const scrub = (v: unknown) =>
        typeof v === 'string' ? v.replace(/([#?&]t=)[^#?&]*/gi, '$1REDACTED') : v
      const p = props as Record<string, unknown>
      for (const k of ['$current_url', '$referrer', '$initial_current_url', '$initial_referrer']) {
        if (k in p) p[k] = scrub(p[k])
      }
      return props
    },
  })
  enabled = true
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (!enabled) return
  posthog.capture(event, props)
}
