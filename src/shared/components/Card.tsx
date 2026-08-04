import { cn } from '@/shared/utils/cn'

type CardProps = {
  children: React.ReactNode
  /** `default` = card estándar (12px). `panel` = bloque grande / sheet (16px). */
  variant?: 'default' | 'panel'
  /** Resalta el borde en color de marca (avisos, destacados). */
  highlight?: boolean
  hoverable?: boolean
  className?: string
  onClick?: () => void
}

// Superficie estándar de la app: fondo blanco, borde `--color-line`, radio 12px.
// Estaba escrita a mano en cada pantalla (con radios y paddings distintos cada
// vez), por eso el sitio parecía dos sitios.
export function Card({ children, variant = 'default', highlight = false, hoverable = false, onClick, className }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'border p-4 transition-all duration-200',
        variant === 'panel' ? 'rounded-xl p-5' : 'rounded-lg',
        highlight
          ? 'border-bosque-lt bg-brand-tint'
          : 'border-line bg-sombra',
        hoverable && 'hover:-translate-y-1 hover:border-bosque-lt',
        (hoverable || onClick) && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}
