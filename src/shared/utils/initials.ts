/**
 * Iniciales de un nombre de negocio, para los perfiles que todavía no tienen foto propia.
 * Descarta artículos y formas jurídicas para quedarse con la parte que identifica.
 *
 *   'Cerrajería Bianchi'             → 'CB'
 *   'ENERGEMA Servicios Eléctricos'  → 'ES'
 *   'Corralón de los Andes SRL'      → 'CA'
 */
const IGNORAR = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'srl', 'sa', 'sas'])

export function initials(name: string): string {
  const palabras = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !IGNORAR.has(w.toLowerCase()))

  return palabras.slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || '·'
}
