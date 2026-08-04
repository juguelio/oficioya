import { cn } from '@/shared/utils/cn'

// Todas las variantes son PILL (rounded-full). Los chips cuadrados de 4px que
// convivían con cards de 12px eran justamente lo que hacía ver "cajas
// rectangulares al lado de cajas redondeadas".
const variants = {
  /** Estado neutro sobre card: "Pendiente", fecha, contador. */
  neutral:   'bg-[--color-noche] text-[--color-muted]',
  /** Estado activo en el color de marca: "Recibiendo presupuestos". */
  tint:      'bg-[--color-brand-tint] text-[--color-bosque-lt]',
  /** Confirmación fuerte: "Subido ✓", "Verificado". */
  verified:  'bg-[--color-bosque-lt] text-white',
  /** Plan destacado — único uso del ámbar fuera de las estrellas. */
  destacado: 'bg-[--color-amber] text-white',
  /** Etiqueta con borde, sobre fondo claro. */
  outline:   'bg-[--color-sombra] text-[--color-muted] border border-[--color-line]',
} as const

type Variant = keyof typeof variants

type BadgeProps = {
  variant?: Variant
  /** `xs` para chips de estado dentro de cards; `sm` es el default. */
  size?: 'xs' | 'sm'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'outline', size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap',
        size === 'xs'
          ? 'px-2 py-0.5 text-[10px] uppercase tracking-widest'
          : 'px-2.5 py-1 text-xs',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
