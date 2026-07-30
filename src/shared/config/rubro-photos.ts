import type { RubroId } from '@/design-system/tokens'

/**
 * Foto real por rubro para las tarjetas del home.
 *
 * POR QUÉ FOTOS: diecisiete iconos de línea del mismo grosor y color se leen como
 * un bloque uniforme por más distintos que sean los objetos — y es el look que
 * delata a una app generada. Las fotos se diferencian solas y no se pueden fingir.
 *
 * Las que faltan quedan en null y la tarjeta cae al icono. NO es un estado final:
 * mientras haya mezcla de fotos e iconos en la misma fila, el carrusel se ve
 * inconsistente. El objetivo es tener foto para los 10 rubros destacados.
 *
 * Criterio para las fotos que faltan: el TRABAJO, no la herramienta suelta ni el
 * retrato posado. Un tablero abierto con las manos adentro dice más que un
 * destornillador sobre una mesa. Vertical o cuadrada, sacada en San Martín.
 */
/**
 * ⚠️ TODAS EN null A PROPÓSITO.
 *
 * Las imágenes que ya hay en public/images (provider-electricista2, -carpintero2,
 * -albanil, -jardinero) son ILUSTRACIONES GENERADAS POR IA heredadas de Stitch:
 * vector plano, muñeco sonriente, fondo liso. Usarlas acá sería reemplazar un look
 * de IA por otro más obvio. Hasta que haya fotos reales, la tarjeta cae al icono,
 * que al menos es consistente en toda la fila.
 */
export const rubroPhotos: Record<RubroId, string | null> = {
  electricista:      null,
  carpintero:        null,
  albanil:           null,
  jardinero:         null,
  plomero:           null,
  gasista:           null,
  pintor:            null,
  cerrajero:         null,
  calefaccionista:   null,
  herrero:           null,
  techista:          null,
  'tecnico-pc':      null,
  flete:             null,
  leniero:           null,
  limpieza:          null,
  cabanas:           null,
  electrodomesticos: null,
}
