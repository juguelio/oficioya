/**
 * Normaliza un teléfono argentino al formato que usa la base: +549XXXXXXXXXX.
 *
 * POR QUÉ: los formularios pedían el número "con código" y prellenaban '+549', pero
 * el prefijo es editable — se borra sin querer, se escribe 0, se agrega el 15, o se
 * pega desde WhatsApp con espacios y guiones. Cada variante entra distinta a la base
 * y rompe el match por teléfono de prospects/claimables, que compara los últimos 10
 * dígitos. Se asume que TODO número es argentino y móvil: el usuario escribe sólo
 * los 10 dígitos (código de área + abonado) y el +549 lo pone la app.
 *
 * Acepta: 2972415230 · 02972 41-5230 · +54 9 2972 415230 · 2972 15 41 5230
 * Devuelve: +5492972415230 · o null si no llega a 10 dígitos.
 */
export function toE164AR(raw: string): string | null {
  let d = (raw ?? '').replace(/\D/g, '')
  if (!d) return null

  if (d.startsWith('54')) d = d.slice(2)   // código de país
  d = d.replace(/^0/, '')                  // 0 de larga distancia
  d = d.replace(/^9/, '')                  // 9 de móvil
  d = d.replace(/^0/, '')                  // 0 pegado después del 9

  // El "15" va después del código de área (2 a 4 dígitos) y sobra en formato
  // internacional. Heurística: si sobran dígitos y hay un '15' en esa ventana, se saca.
  if (d.length > 10) {
    for (const i of [2, 3, 4]) {
      if (d.slice(i, i + 2) === '15' && d.length - 2 >= 10) {
        d = d.slice(0, i) + d.slice(i + 2)
        break
      }
    }
  }

  if (d.length < 10) return null
  return '+549' + d.slice(-10)   // últimos 10: descarta basura pegada adelante
}

/** Para mostrar: +5492972415230 → 2972 41-5230 (sin el prefijo, que va fijo en la UI). */
export function formatLocalAR(e164: string): string {
  const d = e164.replace(/\D/g, '').slice(-10)
  if (d.length !== 10) return e164
  return `${d.slice(0, 4)} ${d.slice(4, 6)}-${d.slice(6)}`
}
