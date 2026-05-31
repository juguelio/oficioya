import { cn } from '@/shared/utils/cn'

type LogoProps = {
  size?: number              // px — controla mark + escala wordmark
  withWordmark?: boolean     // mostrar "OFICIO" al lado del mark
  className?: string
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
// Amber square + bold "O" inside. Funciona como app icon, header logo y favicon.

export function Logo({ size = 32, withWordmark = false, className }: LogoProps) {
  const radius      = Math.round(size * 0.22)
  const fontSize    = Math.round(size * 0.62)
  const wordmarkPx  = Math.round(size * 0.55)

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="relative inline-flex items-center justify-center shrink-0 select-none"
        style={{
          width:           size,
          height:          size,
          backgroundColor: 'var(--color-bosque-lt)',
          borderRadius:    radius,
        }}
        aria-label="Oficio"
      >
        <span
          className="font-black leading-none"
          style={{
            color:         'var(--color-noche)',
            fontSize:      fontSize,
            letterSpacing: '-0.05em',
          }}
        >
          O
        </span>
      </span>

      {withWordmark && (
        <span
          className="font-black tracking-tighter text-[--color-nieve]"
          style={{
            fontSize:      wordmarkPx,
            letterSpacing: '-0.04em',
          }}
        >
          OFICIO
        </span>
      )}
    </span>
  )
}
