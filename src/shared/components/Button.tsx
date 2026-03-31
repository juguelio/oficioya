import { cn } from '@/shared/utils/cn'

const variants = {
  primary:   'bg-[--color-bosque-lt] text-white hover:opacity-90',
  secondary: 'bg-[--color-sombra] text-[--color-nieve] border border-[#2A3A2A] hover:border-[--color-bosque-lt]',
  ghost:     'bg-transparent text-[--color-muted] hover:text-[--color-nieve]',
  whatsapp:  'bg-[#25D366] text-white hover:opacity-90',
  danger:    'bg-red-700 text-white hover:opacity-90',
} as const

const sizes = {
  sm:  'px-3 py-1.5 text-sm',
  md:  'px-5 py-2.5 text-sm',
  lg:  'px-6 py-3 text-base',
  full: 'w-full px-5 py-3 text-sm',
} as const

type Variant = keyof typeof variants
type Size = keyof typeof sizes

type ButtonProps = {
  variant?: Variant
  size?: Size
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  href?: string
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled,
  type = 'button',
  href,
  className,
}: ButtonProps) {
  const base = cn(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-[--radius-md]',
    'transition-all duration-150 cursor-pointer',
    variants[variant],
    sizes[size],
    disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
    className
  )

  if (href) {
    return (
      <a href={href} className={base} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {children}
    </button>
  )
}
