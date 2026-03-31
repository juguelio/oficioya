# SKILL: feature-conventions

Convenciones para crear y organizar features en el proyecto Oficio.

---

## ¿Qué es una feature?

Un módulo autónomo de negocio que agrupa componentes, hooks, tipos y lógica
relacionados. Vive en `src/features/[nombre]/`.

**Regla clave:** una feature puede importar de `shared`, pero **nunca** de otra feature.
Si dos features necesitan algo en común, ese algo va a `shared`.

---

## Estructura de una feature

```
src/features/[nombre]/
├── components/
│   ├── MainComponent.tsx
│   ├── SubComponent.tsx
│   └── index.ts           ← barrel export de todos los componentes
├── hooks/
│   ├── useNombre.ts
│   └── index.ts
├── store.ts               ← estado Zustand (solo si la feature tiene estado global)
└── types.ts               ← todos los tipos de esta feature
```

---

## Template: types.ts

```ts
// src/features/[nombre]/types.ts
import type { CiudadId, RubroId } from '@/design-system/tokens'

export type NombreItem = {
  id: string
  // ...campos
  createdAt: string
}
```

---

## Template: hook de datos

```ts
// src/features/[nombre]/hooks/useNombre.ts
import { useState, useEffect } from 'react'
import type { NombreItem } from '@/features/nombre/types'

type UseNombreReturn = {
  data: NombreItem[]
  isLoading: boolean
  error: string | null
}

export function useNombre(): UseNombreReturn {
  const [data, setData] = useState<NombreItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fase 1: mock data
    // Fase 2: reemplazar con llamada a Supabase
    try {
      // import('@/data/mock-nombre').then(m => setData(m.mockNombre))
      setIsLoading(false)
    } catch (e) {
      setError('Error al cargar datos')
      setIsLoading(false)
    }
  }, [])

  return { data, isLoading, error }
}
```

---

## Template: store Zustand (si la feature necesita estado global)

```ts
// src/features/[nombre]/store.ts
import { create } from 'zustand'
import type { NombreItem } from './types'

type NombreStore = {
  items: NombreItem[]
  selected: NombreItem | null
  setSelected: (item: NombreItem | null) => void
}

export const useNombreStore = create<NombreStore>((set) => ({
  items: [],
  selected: null,
  setSelected: (item) => set({ selected: item }),
}))
```

---

## Features existentes en Oficio

| Feature | Responsabilidad |
|---|---|
| `auth` | Login, registro, sesión del usuario |
| `search` | Búsqueda y filtrado de prestadores |
| `providers` | Perfil, listado y contacto de prestadores |
| `booking` | Solicitar y gestionar trabajos |
| `reviews` | Reseñas de trabajos completados |
| `subscriptions` | Planes y pagos de suscripción (prestadores) |

---

## Reglas

- **Tipos siempre en `types.ts`**, nunca inline en componentes
- **Hooks para toda lógica** — los componentes solo renderizan
- **Store solo si hay estado compartido** entre componentes de la misma feature
- **Barrel exports** en `components/index.ts` y `hooks/index.ts`
- **Imports absolutos** con `@/features/nombre/...` — nunca relativos entre features
- Los componentes de una feature **pueden** importar de `@/shared/components`
- Los componentes de una feature **no pueden** importar de otra feature

---

## Cómo conectar con mock data (fase 1)

```ts
// src/data/mock-nombre.ts
import type { NombreItem } from '@/features/nombre/types'

export const mockNombre: NombreItem[] = [
  {
    id: 'n1',
    // ...
    createdAt: '2025-01-01',
  },
]
```

Importar en el hook con `import { mockNombre } from '@/data/mock-nombre'`.
Cuando llegue Supabase, solo se reemplaza el hook — los componentes no cambian.

---

## Checklist al crear una feature nueva

- [ ] Carpeta en `src/features/[nombre]/`
- [ ] `types.ts` con los tipos base
- [ ] `components/index.ts` barrel vacío (se llena a medida que se agregan componentes)
- [ ] `hooks/index.ts` barrel vacío
- [ ] Mock data en `src/data/mock-[nombre].ts` si la feature necesita datos
- [ ] Rutas nuevas registradas en `src/app/Router.tsx`
- [ ] Tipos exportados desde `src/shared/types/index.ts` si los necesitan otras features
