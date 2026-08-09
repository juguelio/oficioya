// Genera public/sitemap.xml y public/robots.txt antes del build.
//
// Las URLs que importan para el canal orgánico son las combinaciones ciudad × rubro
// ("gasista junín de los andes"), y salen enteras de tokens.ts — no hacen falta ni
// red ni base de datos, así que esto corre igual en cualquier máquina y en Vercel.
//
// Los perfiles individuales (cientos, y cambiantes) quedan fuera a propósito: se
// agregan cuando haya prestadores reales. Un sitemap lleno de perfiles sin dueño le
// pide a Google que gaste el rastreo en páginas que no convierten a nadie.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = readFileSync(resolve(raiz, 'src/design-system/tokens.ts'), 'utf8')

/** Extrae los `id` de un bloque `export const <nombre> = [ ... ] as const`. */
function ids(nombre) {
  const bloque = tokens.match(new RegExp(`export const ${nombre} = \\[([\\s\\S]*?)\\] as const`))
  if (!bloque) throw new Error(`No se encontró el bloque "${nombre}" en tokens.ts`)
  return [...bloque[1].matchAll(/id:\s*'([^']+)'/g)].map(m => m[1])
}

/** El radio operativo: sólo las ciudades que el selector realmente ofrece. */
function radio() {
  const linea = tokens.match(/export const radioOperativoV1[^=]*=\s*\[([^\]]*)\]/)
  if (!linea) throw new Error('No se encontró radioOperativoV1 en tokens.ts')
  return [...linea[1].matchAll(/'([^']+)'/g)].map(m => m[1])
}

const ciudades = radio()
const rubros   = ids('rubros')

// Si tokens.ts cambia de forma, esto falla acá y no en silencio tres semanas después.
if (ciudades.length < 2) throw new Error(`Sólo ${ciudades.length} ciudad(es) en el radio: revisá el parseo`)
if (rubros.length < 10)  throw new Error(`Sólo ${rubros.length} rubros: revisá el parseo`)

const SITE = 'https://www.oficioya.app'
const hoy = new Date().toISOString().slice(0, 10)

const urls = [
  { loc: '/',          prio: '1.0' },
  { loc: '/emergencias', prio: '0.6' },
  { loc: '/trabajos',    prio: '0.6' },
  { loc: '/registro/prestador', prio: '0.5' },
  { loc: '/planes',      prio: '0.4' },
  { loc: '/privacidad',  prio: '0.2' },
  { loc: '/terminos',    prio: '0.2' },
  ...ciudades.flatMap(c => rubros.map(r => ({ loc: `/${c}/${r}`, prio: '0.8' }))),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <lastmod>${hoy}</lastmod>
    <priority>${u.prio}</priority>
  </url>`).join('\n')}
</urlset>
`

// Lo privado no se rastrea: paneles, activación por token y carga de documentos.
const robots = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /mis-trabajos
Disallow: /admin
Disallow: /activar
Disallow: /verificacion
Disallow: /perfil

Sitemap: ${SITE}/sitemap.xml
`

mkdirSync(resolve(raiz, 'public'), { recursive: true })
writeFileSync(resolve(raiz, 'public/sitemap.xml'), sitemap)
writeFileSync(resolve(raiz, 'public/robots.txt'), robots)
console.log(`sitemap.xml: ${urls.length} URLs (${ciudades.length} ciudades × ${rubros.length} rubros + fijas) · robots.txt ok`)
