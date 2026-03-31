import { cn } from '@/shared/utils/cn'

const sizes = {
  sm:  'w-8 h-8 text-sm',
  md:  'w-11 h-11 text-base',
  lg:  'w-16 h-16 text-2xl',
} as const

type Size = keyof typeof sizes

type AvatarProps = {
  name: string
  src?: string
  size?: Size
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// Color determinístico según nombre — siempre el mismo color para la misma persona
function getColor(name: string): string {
  const colors = [
    '#3D6B3C', '#2E6E8A', '#8A6A4A', '#5B4A8A', '#8A4A5B',
    '#4A7A6A', '#6A4A8A', '#8A6A3D', '#3D5B8A', '#6A8A3D',
  ]
  const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  return colors[index]
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-[--radius-md] object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-[--radius-md] flex items-center justify-center',
        'font-bold text-white flex-shrink-0',
        sizes[size],
        className
      )}
      style={{ background: getColor(name) }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  )
}
