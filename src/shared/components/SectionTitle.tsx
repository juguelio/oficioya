import { cn } from '@/shared/utils/cn'

type SectionTitleProps = {
  children: React.ReactNode
  /** Línea chica arriba del título ("Cerca tuyo", "Paso 2 de 2"). */
  eyebrow?: string
  /** Contenido a la derecha (link "ver todos", contador). */
  right?: React.ReactNode
  className?: string
}

// Título de sección. Una sola voz tipográfica para "Servicios", "Reseñas",
// "Sobre mí", "Mis trabajos": antes cada pantalla elegía entre font-black,
// font-bold o un eyebrow en mayúsculas para jerarquías equivalentes.
export function SectionTitle({ children, eyebrow, right, className }: SectionTitleProps) {
  return (
    <div className={cn('flex items-end justify-between gap-3 mb-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest mb-0.5 text-muted">
            {eyebrow}
          </p>
        )}
        <h2 className="font-black text-lg" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
          {children}
        </h2>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
