import { useId } from 'react'
import type { RubroId } from '@/design-system/tokens'
import { cn } from '@/shared/utils/cn'

/**
 * Set de iconos propio para los rubros. Reemplaza los emojis, que renderizaban
 * distinto en cada sistema operativo y no compartían peso ni estilo entre sí.
 *
 * Dos variantes sobre la MISMA geometría:
 *  · 'line'   — trazo limpio. Para tamaños chicos: listados, filtros, chips.
 *  · 'sketch' — el mismo dibujo pasado por un filtro de turbulencia que le da
 *               temblor de mano alzada. Para tamaños grandes: home y carrusel.
 *
 * El filtro se aplica sobre la geometría en vez de duplicar 17 paths dibujados
 * a mano: un solo lugar donde ajustar el temblor. A menos de ~24px el
 * desplazamiento empasta el trazo, por eso 'sketch' NO se usa en listados.
 */

type Paths = readonly string[]

const ICONS: Record<RubroId, Paths> = {
  // Criterio de dibujo: lo que distingue un icono a 24px es la SILUETA, no el
  // detalle interior. Por eso se elige para cada rubro el objeto de contorno más
  // singular (diagonales, X, T, formas orgánicas) y se evita acumular rectángulos.
  electricista: ['M9 3v3.5M15 3v3.5', 'M6.5 6.5h11v3.5a5.5 5.5 0 0 1-11 0z', 'M12 16v3a2 2 0 0 0 2 2h3.5'],

  plomero: ['M5 3v8a7 7 0 0 0 14 0V3', 'M2.8 3h4.4M16.8 3h4.4'],

  gasista: [
    'M12 21c3.6 0 6-2.3 6-5.4 0-3.6-3-5.3-3.6-9.6-2 1.3-3 3.2-3 5 0 1-.6 1.6-1.2 1.6-.7 0-1.2-.6-1.2-1.6 0-.6.1-1.1.3-1.7C7.6 11 6 13 6 15.6 6 18.7 8.4 21 12 21z',
  ],

  carpintero: [
    'M2.5 6h11.6l3.2 4H5.7z',
    'M5.7 10l1.3 1.8 1.2-1.8 1.3 1.8 1.2-1.8 1.3 1.8 1.2-1.8 1.3 1.8 1.2-1.8',
    'M17.3 10c2.3 0 3.9 1.2 3.9 2.8s-1.6 2.7-3.5 2.6',
  ],

  // cuchara de albañil — triángulo. Los ladrillos eran otro rectángulo más.
  albanil: ['M2.5 9.6 13 3.2l-1.6 11.7z', 'M12.6 7.2 16.3 4.7', 'M15.9 3.7 19.4 6.1 18 8.3 14.5 5.9z'],

  // brocha en diagonal — el rodillo leía como rectángulo
  pintor: [
    'M19.6 3.2 13.1 9.7',
    'M12.4 8.9l2.8 2.8-2 2-2.8-2.8z',
    'M10.4 10.9 5 16.3a2.3 2.3 0 0 0 3.3 3.3l5.4-5.4z',
  ],

  cerrajero: [
    'M15.6 3.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4z',
    'M12.7 10.9 4 19.6',
    'M6.4 17.2l2 2M8.6 15l2 2',
  ],

  // tijera de podar — forma en X. La hoja era demasiado genérica.
  jardinero: [
    'M7 3.4 15.9 13.8M17 3.4 8.1 13.8',
    'M8.1 13.8 6.9 15.2M15.9 13.8l1.2 1.4',
    'M6.2 16a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8z',
    'M17.8 16a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8z',
  ],

  // salamandra: patas y caño la separan de la heladera
  calefaccionista: [
    'M13.2 2.5h2.6v4',
    'M5 6.5h10v8.6c0 .9-.7 1.6-1.6 1.6H6.6c-.9 0-1.6-.7-1.6-1.6z',
    'M7 16.7v2.6M13 16.7v2.6',
    'M10 9.2c1 1 1.6 1.9 1.6 2.8a1.6 1.6 0 0 1-3.2 0c0-.9.6-1.8 1.6-2.8z',
  ],

  // martillo — el yunque era un borrón a 20px
  herrero: ['M3.4 6.4 9.7 3l2.1 4-6.3 3.4z', 'M9.9 8.6 19 17.7a1.65 1.65 0 0 1-2.3 2.3L7.6 10.9z'],

  techista: ['M2 12 12 4l10 8', 'M4.6 14.4 12 8.6l7.4 5.8', 'M7.2 16.8 12 13.1l4.8 3.7'],

  // notebook con base — la base la separa de la heladera
  'tecnico-pc': ['M5 5.4h14v8.4H5z', 'M2.4 17.6h19.2l-2-3.8H4.4z'],

  flete: [
    'M2.5 6.6h10.4v8.8H2.5z',
    'M12.9 9.6h3.7l2.9 3v2.8h-6.6',
    'M6.9 15.4a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z',
    'M16.4 15.4a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z',
  ],

  // hacha — los troncos de punta se confundían con burbujas
  leniero: ['M12.8 3.2c3.2.7 5.5 2.9 5.9 5.9l-4.9 1.7c-.4-1.7-1.5-2.9-3-3.4z', 'M11.5 8.6 4.8 19.8'],

  // escoba en diagonal — el balde no decía "limpieza" solo
  limpieza: [
    'M18.4 3.2 11.2 11.4',
    'M9.2 9.8 13.6 14',
    'M9.2 9.8 3.4 17.6 10.6 20.4 13.6 14z',
    'M6.3 13.7 5.6 19.3M9.2 14.6 8.9 20.1',
  ],

  cabanas: [
    'M3 11.2 12 4l9 7.2',
    'M5.6 10.2V19.6h12.8V10.2',
    'M16.4 6.6V3.6H19v5',
    'M10 19.6v-5.2h4v5.2',
  ],

  electrodomesticos: [
    'M5.6 2.6h12.8v18.8H5.6z',
    'M5.6 9.7h12.8',
    'M8.7 5.3v2.3M8.7 12.5v3',
  ],
}

type RubroIconProps = {
  rubro: RubroId
  /** 'line' para <24px, 'sketch' para tamaños grandes. */
  variant?: 'line' | 'sketch'
  size?: number
  className?: string
  /** El color se toma de `currentColor`; usar style={{ color: 'var(--color-*)' }}. */
  style?: React.CSSProperties
}

export function RubroIcon({ rubro, variant = 'line', size = 24, className, style }: RubroIconProps) {
  // id único por instancia: un filter="url(#...)" que no resuelve hace que el
  // elemento no se dibuje en absoluto, así que no puede ser un id compartido.
  const filterId = useId().replace(/:/g, '')
  const paths = ICONS[rubro]
  const isSketch = variant === 'sketch'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={isSketch ? 2 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('shrink-0', className)}
      style={style}
    >
      {isSketch && (
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      )}
      <g filter={isSketch ? `url(#${filterId})` : undefined}>
        {paths.map((d, i) => <path key={i} d={d} />)}
      </g>
    </svg>
  )
}
