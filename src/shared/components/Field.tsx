import { cn } from '@/shared/utils/cn'

const ERROR_COLOR = '#ffb4ab'

type FieldProps = {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

// Label + control + error. Estaba duplicado textualmente en ProviderLogin,
// ProviderSignup y ClientSignup — tres copias que ya empezaban a divergir.
export function Field({ label, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-xs font-bold tracking-[0.12em] uppercase text-[--color-muted]">
        {label}
      </label>
      {children}
      {error
        ? <p className="text-xs font-semibold" style={{ color: ERROR_COLOR }}>{error}</p>
        : hint
          ? <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</p>
          : null}
    </div>
  )
}

// Clases del input estándar. Se exporta como función para poder combinarla con
// extras (por ejemplo `pr-12` cuando hay un ojito de mostrar contraseña).
export function inputClasses(hasError = false, className?: string) {
  return cn(
    'w-full h-14 px-4 rounded-lg text-[--color-nieve]',
    'bg-[--color-sombra] border border-[--color-line]',
    'placeholder:text-[--color-muted]/60 transition-shadow',
    'focus:outline-none focus:ring-1 focus:ring-[--color-bosque-lt]/40',
    hasError && 'ring-1 ring-[#ffb4ab]/60 border-[#ffb4ab]/40',
    className,
  )
}

type FormErrorProps = { children: React.ReactNode; className?: string }

// Bloque de error del formulario (el rojo suave arriba del botón de submit).
export function FormError({ children, className }: FormErrorProps) {
  return (
    <div
      className={cn('px-4 py-3 rounded-lg text-sm font-semibold', className)}
      style={{ backgroundColor: '#ffb4ab18', color: ERROR_COLOR, border: '1px solid #ffb4ab30' }}
    >
      {children}
    </div>
  )
}
