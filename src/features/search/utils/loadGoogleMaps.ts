import { Loader } from '@googlemaps/js-api-loader'

// Key del BROWSER (distinta de GOOGLE_PLACES_API_KEY, que es server-side en n8n).
// Vite la inlinea en el bundle público → DEBE estar restringida por HTTP referrer.
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

let loaderPromise: Promise<typeof google> | null = null

export function hasMapsKey(): boolean {
  return Boolean(apiKey)
}

// Carga Google Maps JS una sola vez (singleton). Rechaza si falta la key, para que el
// componente pueda degradar con un mensaje claro en vez de romperse.
export function loadGoogleMaps(): Promise<typeof google> {
  if (!apiKey) return Promise.reject(new Error('missing-maps-key'))
  if (loaderPromise) return loaderPromise
  const loader = new Loader({ apiKey, version: 'weekly' })
  const p = loader.load()
  loaderPromise = p
  return p
}
