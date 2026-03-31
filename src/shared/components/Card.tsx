import { cn } from '@/shared/utils/cn'

type CardProps = {
  children: React.ReactNode
  hoverable?: boolean
  className?: string
  onClick?: () => void
}

export function Card({ children, hoverable = false, onClick, className }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[--radius-lg] border border-[#1E2E1E] bg-[--color-sombra] p-4',
        'transition-all duration-200',
        hoverable && 'hover:-translate-y-1 hover:border-[--color-bosque-lt] cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
