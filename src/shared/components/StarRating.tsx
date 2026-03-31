import { cn } from '@/shared/utils/cn'

type StarRatingProps = {
  value: number        // 0 a 5
  showValue?: boolean  // mostrar el número al lado
  size?: 'sm' | 'md'
  className?: string
}

export function StarRating({ value, showValue = true, size = 'sm', className }: StarRatingProps) {
  const rounded = Math.round(value * 2) / 2 // redondear a 0.5

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className={cn('text-amber-400', size === 'sm' ? 'text-sm' : 'text-base')}>
        ★
      </span>
      {showValue && (
        <span
          className={cn(
            'font-semibold tabular-nums',
            size === 'sm' ? 'text-sm' : 'text-base',
            'text-[--color-nieve]'
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {rounded.toFixed(1)}
        </span>
      )}
    </div>
  )
}
