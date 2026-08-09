import { useEffect } from 'react'
import type { SeoData } from './types'

// El dominio canónico es con www: el apex redirige (301) hacia acá desde vercel.json.
// Un canonical que apunta a una URL que redirige es una señal contradictoria.
export const SITE_URL = 'https://www.oficioya.app'

const DEFAULTS = {
  title: 'Oficio — La guía de oficios de San Martín y Junín de los Andes',
  description:
    'Electricistas, plomeros, gasistas, cerrajeros y más en San Martín de los Andes y ' +
    'Junín de los Andes. Buscá por rubro y contactalos directo por WhatsApp.',
  path: '/',
} as const

const LD_ID = 'oficio-jsonld'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

function setJsonLd(data: SeoData['jsonLd']) {
  document.getElementById(LD_ID)?.remove()
  if (!data) return
  const el = document.createElement('script')
  el.id = LD_ID
  el.type = 'application/ld+json'
  el.textContent = JSON.stringify(data)
  document.head.appendChild(el)
}

function apply({ title, description, path, jsonLd }: SeoData) {
  const url = SITE_URL + path
  document.title = title
  upsertMeta('name', 'description', description)
  upsertCanonical(url)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  setJsonLd(jsonLd)
}

/**
 * SEO por ruta en una SPA.
 *
 * Todo el sitio compartía el título, la descripción y el canonical de `index.html`.
 * Para Google eso son cientos de páginas —cada ciudad × rubro, cada perfil— diciendo
 * ser la misma. El canal natural de este producto es alguien buscando
 * "gasista junín de los andes" a las once de la noche, y esa búsqueda no se gana
 * con contenido: se gana existiendo como página propia.
 *
 * `data` puede ser null mientras se cargan los datos: en ese caso no se toca nada
 * y la página conserva lo anterior hasta tener algo verdadero que poner.
 */
export function useSeo(data: SeoData | null) {
  const key = data ? JSON.stringify(data) : null
  useEffect(() => {
    if (!key) return
    apply(JSON.parse(key) as SeoData)
    return () => { apply(DEFAULTS) }
  }, [key])
}
