import { cn } from '@/shared/utils/cn'

const variants = {
  verified:  'bg-[--color-bosque-lt] text-white',
  destacado: 'bg-amber-500 text-white',
  rubro:     'bg-[--color-sombra] text-[--color-muted] border border-[--color-line]',
  status:    'bg-[--color-sombra] text-[--color-bosque-lt] border border-[--color-line]',
  new:       'bg-[--color-lago] text-white',
} as const

type Variant = keyof typeof variants

type BadgeProps = {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'rubro', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-[--radius-full]',
      'px-2.5 py-0.5 text-xs font-semibold',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
