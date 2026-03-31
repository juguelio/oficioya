# SKILL: new-component

Usá esta skill cada vez que necesites crear un componente nuevo en el proyecto Oficio.

---

## Antes de escribir código, preguntate:

1. **¿Es shared o de feature?**
   - `src/shared/components/` → si lo van a usar 2+ features
   - `src/features/[feature]/components/` → si es específico de una sola feature

2. **¿Ya existe algo parecido?**
   - Revisá `src/shared/components/` antes de crear uno nuevo
   - Preferí extender antes que duplicar

---

## Estructura de un componente

```
ComponentName/
├── ComponentName.tsx      ← el componente
├── ComponentName.test.tsx ← (opcional, cuando haya tests)
└── index.ts               ← barrel export
```

Si el componente es simple (sin subcarpeta necesaria), puede vivir directo como `ComponentName.tsx` con el export en el `index.ts` del directorio padre.

---

## Template base

```tsx
// src/shared/components/ComponentName/ComponentName.tsx
import { cn } from '@/shared/utils/cn'

type ComponentNameProps = {
  // props requeridas primero
  // props opcionales después con ?
  className?: string
}

export function ComponentName({ className }: ComponentNameProps) {
  return (
    <div className={cn('', className)}>
      {/* contenido */}
    </div>
  )
}
```

---

## Reglas que siempre se aplican

- **Named export** siempre — nunca `export default`
- **Props type** en el mismo archivo, con sufijo `Props`
- **`className` opcional** en todo componente visual para permitir override
- **`cn()`** para combinar clases de Tailwind (importar de `@/shared/utils/cn`)
- **Un componente por archivo** — sin excepción
- **Sin lógica de negocio** en shared — solo presentación
- **Sin hardcodear colores** — usar variables CSS del design system (`--color-bosque`, etc.)

---

## Variantes con Tailwind

Para componentes con variantes (Button, Badge, etc.) usá un objeto de variantes:

```tsx
const variants = {
  primary:   'bg-[--color-bosque-lt] text-white',
  secondary: 'bg-[--color-sombra] text-[--color-nieve] border border-[#2A3A2A]',
  ghost:     'bg-transparent text-[--color-muted] hover:text-[--color-nieve]',
} as const

type Variant = keyof typeof variants

type ButtonProps = {
  variant?: Variant
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function Button({ variant = 'primary', children, onClick, disabled, className }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-[--radius-md] px-5 py-2.5 font-semibold transition-all',
        variants[variant],
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}
```

---

## Componentes del design system disponibles

Importar siempre desde `@/shared/components`:

```ts
import { Button, Badge, Card, Avatar, StarRating } from '@/shared/components'
```

**No** importar directo desde la ruta del archivo.

---

## CSS Variables disponibles (theme.css)

```css
--color-bosque        /* verde oscuro patagónico */
--color-bosque-lt     /* verde claro, color primario */
--color-lago          /* azul lago */
--color-nieve         /* texto principal, casi blanco cálido */
--color-tierra        /* marrón, acentos */
--color-noche         /* fondo principal */
--color-sombra        /* fondo de cards */
--color-muted         /* texto secundario */

--font-display        /* Playfair Display — títulos */
--font-body           /* Raleway — cuerpo */
--font-mono           /* JetBrains Mono — precios, stats */

--radius-sm / --radius-md / --radius-lg / --radius-xl / --radius-full
```

---

## Ejemplo real: ProviderCard

```tsx
// src/features/providers/components/ProviderCard/ProviderCard.tsx
import { cn } from '@/shared/utils/cn'
import { Badge, StarRating, Avatar } from '@/shared/components'
import { formatDistance } from '@/shared/utils/distance'
import type { Provider } from '@/features/providers/types'

type ProviderCardProps = {
  provider: Provider
  distanceKm?: number
  onContact: (provider: Provider) => void
  className?: string
}

export function ProviderCard({ provider, distanceKm, onContact, className }: ProviderCardProps) {
  const waLink = `https://wa.me/${provider.phone.replace(/\D/g, '')}`

  return (
    <article className={cn(
      'rounded-[--radius-lg] border border-[#1E2E1E] bg-[--color-sombra]',
      'p-4 transition-all hover:-translate-y-1 hover:border-[--color-bosque-lt]',
      className
    )}>
      <div className="flex items-start gap-3">
        <Avatar name={provider.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{provider.name}</h3>
            {provider.isVerified && (
              <Badge variant="verified">✓</Badge>
            )}
          </div>
          <p className="text-sm text-[--color-muted]">
            {provider.barrio ?? provider.ciudad}
            {distanceKm !== undefined && ` · ${formatDistance(distanceKm)}`}
          </p>
        </div>
        <StarRating value={provider.rating} />
      </div>

      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'mt-3 flex w-full items-center justify-center gap-2',
          'rounded-[--radius-md] bg-[#25D366] py-2.5 text-sm font-bold text-white',
          'transition-opacity hover:opacity-90'
        )}
      >
        Contactar por WhatsApp
      </a>
    </article>
  )
}
```

---

## Barrel export (no olvidar)

Cada vez que creás un componente nuevo, agregalo al `index.ts` del directorio:

```ts
// src/shared/components/index.ts
export { Button } from './Button/Button'
export { Badge } from './Badge/Badge'
export { Card } from './Card/Card'
export { Avatar } from './Avatar/Avatar'
export { StarRating } from './StarRating/StarRating'
// → agregar acá cada componente nuevo
```
