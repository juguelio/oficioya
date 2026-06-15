# CLAUDE.md — Oficio

Leé este archivo completo antes de escribir cualquier código. Es la fuente de verdad del proyecto.

---

## 1. Qué es Oficio

Marketplace hiperlocal que conecta clientes con trabajadores de oficios (electricistas, plomeros, carpinteros, etc.) en el corredor andino patagónico. Modelo tipo Uber/Rappi:

- **Clientes:** app gratuita — buscan, contactan por WhatsApp
- **Prestadores:** pagan suscripción mensual en ARS para aparecer en la plataforma
- **Emergencias 24/7:** capa de negocio adicional — prestadores en "modo guardia" cobran $20.000 ARS por contacto, con paywall antes de revelar el WhatsApp

### Las tres ciudades (y solo estas tres, en fase 1)

| Ciudad | CiudadId | Prefijo tel | Lat | Lng |
|--------|----------|-------------|-----|-----|
| San Martín de los Andes | `san-martin` | `+5492972` | -40.1573 | -71.3520 |
| Villa La Angostura | `villa-la-angostura` | `+5492972` | -40.7583 | -71.6466 |
| Bariloche | `bariloche` | `+5492944` | -41.1335 | -71.3103 |

Nunca mencionar "Junín de los Andes" — la ciudad correcta es San Martín de los Andes.

### Flujo cliente (happy path)
```
/ → seleccionar ciudad → ver rubros → /:ciudad/:rubro → /prestador/:id → WhatsApp ✓
```

### Flujo prestador (happy path)
```
/onboarding → /registro/prestador → /verificacion → /planes → pago MercadoPago → recibir contactos ✓
```

---

## 2. Stack técnico

| Capa | Tech | Notas |
|------|------|-------|
| UI | React 18 + Vite + TypeScript | strict mode |
| Estilos | Tailwind CSS v4 | utility-first, sin CSS Modules |
| Routing | React Router v7 | lazy loading en todas las páginas |
| Estado global | Zustand v5 + persist | solo para estado inter-sesión |
| Forms | React Hook Form v7 + Zod + `@hookform/resolvers` | |
| Backend (en producción) | Supabase (Auth, DB, Storage privado/KYC, Realtime para guardia) | 9 migraciones aplicadas. Cliente en `src/lib/supabase.ts` |
| Datos legacy mock | `src/data/` | directorio de prestadores aún lee mock; trabajos/reseñas mock — migración pendiente |
| Analytics | PostHog (`src/lib/analytics.ts`) | conteo de clics de WhatsApp (ADR-001). Key en `.env.local` |
| Pagos | MercadoPago | no implementado aún |
| Deploy | Vercel — `oficioya.app` | |

---

## 3. Estructura de archivos

```
src/
├── app/
│   ├── App.tsx              ← Suspense + RouterProvider
│   └── Router.tsx           ← todas las rutas, lazy loaded
├── data/
│   ├── mock-providers.ts    ← 10 prestadores, ordenados por ciudad
│   └── rubros.ts            ← (legacy — la fuente de verdad es tokens.ts)
├── design-system/
│   ├── theme.css            ← CSS variables + Tailwind @import
│   └── tokens.ts            ← ciudades[], rubros[], colors, tipos CiudadId/RubroId
├── features/
│   ├── auth/
│   │   └── components/
│   │       ├── OnboardingPage.tsx       /onboarding
│   │       ├── ProviderRegisterPage.tsx /registro/prestador
│   │       ├── VerificationPage.tsx     /verificacion
│   │       └── RegisterPage.tsx        /login (placeholder)
│   ├── booking/
│   │   └── types.ts
│   ├── providers/
│   │   ├── components/
│   │   │   ├── ProviderCard/ProviderCard.tsx
│   │   │   ├── ProviderProfile.tsx      /prestador/:id
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useProviders.ts          ← filtrado + ordenamiento
│   │   │   └── index.ts
│   │   └── types.ts                     ← tipo Provider
│   ├── reviews/
│   │   └── types.ts
│   ├── search/
│   │   ├── components/
│   │   │   ├── HomePage.tsx             /
│   │   │   ├── RubroPage.tsx            /:ciudad/:rubro
│   │   │   ├── EmergencyPage.tsx        /emergencias
│   │   │   └── CityPage.tsx
│   │   └── store.ts                     ← useCityStore (Zustand + persist)
│   └── subscriptions/
│       ├── components/
│       │   └── PricingPage.tsx          /planes
│       └── types.ts                     ← tipo SubscriptionPlan
└── shared/
    ├── components/
    │   ├── Avatar.tsx
    │   ├── Badge.tsx
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── StarRating.tsx
    │   └── index.ts         ← barrel: importar siempre desde acá
    ├── types/
    │   └── index.ts
    └── utils/
        ├── cn.ts            ← classnames helper
        ├── distance.ts      ← haversine
        └── formatARS.ts     ← Intl.NumberFormat es-AR ARS
```

### Regla de imports entre features

Una feature **puede** importar de `@/shared/*` y `@/design-system/*`.
Una feature **no puede** importar de otra feature.
Si dos features necesitan algo, ese algo va a `@/shared/`.

---

## 4. Rutas actuales

```
/                          HomePage
/:ciudad/:rubro            RubroPage  (e.g. /san-martin/electricista)
/prestador/:id             ProviderProfile
/planes                    PricingPage
/emergencias               EmergencyPage
/onboarding                OnboardingPage
/registro/prestador        ProviderRegisterPage
/verificacion              VerificationPage
/login                     RegisterPage (placeholder)
/registrarme               → redirect a /registro/prestador
```

Todas las páginas son lazy-loaded. El patrón en Router.tsx:
```ts
const Page = lazy(() => import('@/features/x/components/Page').then(m => ({ default: m.Page })))
```

---

## 5. Tipos clave

### Provider (`src/features/providers/types.ts`)
```ts
type Provider = {
  id: string                 // 'p1', 'p2', ... secuencial
  name: string
  rubro: RubroId
  ciudad: CiudadId
  barrio?: string
  phone: string              // '+549XXXXXXXXXX' sin espacios
  rating: number             // 0.0–5.0, un decimal
  totalJobs: number
  isVerified: boolean
  subscription: 'basico' | 'profesional' | 'destacado' | null
  status: 'active' | 'inactive' | 'pending'
  lat?: number
  lng?: number
  bio?: string
  photos: string[]
  createdAt: string          // 'YYYY-MM-DD'
}
```

### SubscriptionPlan (`src/features/subscriptions/types.ts`)
```ts
type SubscriptionPlan = {
  id: 'basico' | 'profesional' | 'destacado'
  label: string
  priceARS: number
  contactsPerMonth: number | 'unlimited'
  hasBadge: boolean
  priority: 'normal' | 'alta' | 'maxima'
}
```

### CiudadId y RubroId
Derivados automáticamente de los arrays en `tokens.ts` via `typeof array[number]['id']`.
**Nunca hardcodear strings de ciudad o rubro — siempre usar los tipos.**

---

## 6. Rubros disponibles (RubroId)

```
electricista | plomero | gasista | carpintero | albanil | pintor |
cerrajero | jardinero | calefaccionista | herrero |
techista | tecnico-pc | flete | leniero | limpieza | cabanas
```

Total: 16 rubros. Fuente de verdad: `src/design-system/tokens.ts`.

---

## 7. Planes de suscripción y ordenamiento

### Planes (precios a revisar cada 3 meses por inflación)

| Plan | Precio/mes | Contactos | Badge | Prioridad |
|------|-----------|-----------|-------|-----------|
| Básico | $20.000 ARS | 8/mes | ✗ | Normal |
| Profesional | $35.000 ARS | Ilimitados | ✓ | Alta |
| Destacado | $55.000 ARS | Ilimitados | ✓ | Máxima + banner |

### Ordenamiento en listados (implementado en `useProviders.ts`)

```
1. 🔴 En guardia ahora (modo guardia, cualquier plan)  ← SIEMPRE PRIMERO
2. ⭐ Destacado
3. ✓ Profesional
4.    Básico
5.    Sin plan (null)
— Dentro de cada grupo: rating descendente
```

**IMPORTANTE:** `useProviders` actualmente no implementa el criterio de "modo guardia" porque el campo `isOnGuardia` no existe aún en el tipo `Provider`. Cuando se agregue, insertar como primer criterio de orden.

El planOrder actual en `useProviders.ts`:
```ts
const planOrder = { destacado: 0, profesional: 1, basico: 2, null: 3 }
```

---

## 8. Modelo de Emergencias 24/7

- Prestadores activan toggle "Modo guardia 🔴" desde su panel
- Aparecen primero en home, listado (`RubroPage`) y `EmergencyPage`
- Cualquier CTA de un prestador en guardia → **paywall** (MercadoPago)
- Precio: **$20.000 ARS por contacto** (revisar cada 3 meses)
- Pago ANTES de revelar el WhatsApp
- Post-pago: mensaje WhatsApp pre-cargado:
  `"Hola [nombre], te contacto desde Oficio. Tengo una urgencia con [rubro] en [ciudad]. ¿Podés venir?"`
- Garantía: sin respuesta en 10 min → crédito para próxima emergencia
- El modo guardia es independiente del plan de suscripción

---

## 9. Estado global (Zustand)

### useCityStore (`src/features/search/store.ts`)
```ts
{
  ciudadId: CiudadId | null
  setCiudad: (id: CiudadId) => void
  clearCiudad: () => void
}
```
Persistido en `localStorage` con key `'oficio-ciudad'`.

Cuando `RubroPage` carga, lee `ciudad` de los URL params (`/:ciudad/:rubro`) y la sincroniza al store via `useEffect`. El store persiste entre sesiones — no asumir que siempre es null.

---

## 10. Design system

### CSS Variables (definidas en `theme.css`)

```css
/* Fondos — usar en este orden de profundidad */
--color-noche:     #0E1510   /* fondo base de la app */
--color-sombra:    #1A2A1A   /* cards, panels */
/* Stitch también usa: #1a2026, #252b30, #161c22, #090f14 */

/* Texto */
--color-nieve:     #EFF3EE   /* texto principal */
--color-muted:     #7A9A79   /* texto secundario */

/* Acento primario */
--color-bosque-lt: #4A8C49   /* botones, links activos, highlights */
--color-bosque-dk: #1E3A1E   /* headers oscuros */
--color-lago:      #2E6E8A   /* info, badges secundarios */

/* Fuera del sistema de variables — colores hardcodeados aceptados */
#25D366   /* WhatsApp — solo para ese CTA, nunca otro uso */
#F5C842   /* amarillo destacado premium */
#ffb4ab   /* error / emergencias */
#3de273   /* verde Stitch — acento emergencias */
```

### Paleta Stitch (pantallas importadas de Stitch tienen estos valores)
Las pantallas importadas de Stitch usan un sistema de colores diferente al `theme.css`. Al adaptar:
- `surface` = `#0e1419` ≈ `--color-noche`
- `surface-container` = `#1a2026` ≈ `--color-sombra`
- `tertiary` = `#3de273` (usado en EmergencyPage, OnboardingPage)
- `on-surface` = `#dde3eb` ≈ `--color-nieve`

### Tipografía

```css
--font-display: 'Playfair Display'   /* H1, hero, títulos de página */
--font-body:    'Raleway'            /* cuerpo, labels, botones */
--font-mono:    'JetBrains Mono'     /* precios, stats, números */
```

Reglas:
- Títulos grandes: `letter-spacing: -0.03em` siempre
- Precios: siempre `font-family: var(--font-mono)` + `font-variant-numeric: tabular-nums`
- Labels/eyebrows: `text-xs font-bold tracking-[0.15em] uppercase`

### Radios
```css
--radius-sm: 4px   --radius-md: 8px   --radius-lg: 12px
--radius-xl: 16px  --radius-full: 9999px
```

En Tailwind: `rounded-[--radius-xl]`, `rounded-[--radius-full]`, etc.

### Headers fijos (patrón estándar)
```tsx
<header
  className="fixed top-0 w-full z-50 backdrop-blur-xl flex items-center px-6 h-16"
  style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
>
```
Todas las páginas usan `pt-16` o `pt-24` en el `<main>` para compensar.

### Bottom nav (patrón estándar)
```tsx
<nav
  className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-xl flex justify-around items-center px-4 py-3"
  style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
>
```
El `<main>` usa `pb-24` o `pb-32` para que el contenido no quede tapado.

---

## 11. Convenciones de componentes

### Reglas absolutas
- **Named export siempre** — nunca `export default`
- **Un componente por archivo** — sin excepción
- **Props type en el mismo archivo**, sufijo `Props`: `type FooProps = { ... }`
- **`className?: string` opcional** en todo componente visual (permite override)
- **`cn()`** para combinar clases: `import { cn } from '@/shared/utils/cn'`
- **Sin lógica de negocio** en componentes de `shared/` — solo presentación
- **Tipos en `types.ts`** de la feature — nunca inline en componentes
- **Barrel exports** en `components/index.ts` y `hooks/index.ts`

### Template base
```tsx
import { cn } from '@/shared/utils/cn'

type ComponentNameProps = {
  // requeridas primero
  // opcionales después con ?
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

### Variantes con objeto
```tsx
const variants = {
  primary:   'bg-[--color-bosque-lt] text-white',
  secondary: 'bg-[--color-sombra] text-[--color-nieve] border border-[#2A3A2A]',
  ghost:     'bg-transparent text-[--color-muted] hover:text-[--color-nieve]',
} as const
type Variant = keyof typeof variants
```

### Íconos
Todos inline como SVG dentro del archivo del componente. Sin dependencias de icon libraries (Material Symbols solo se usa en código generado por Stitch, se reemplaza al adaptar). Patrón:
```tsx
function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}
```

---

## 12. Reglas de UX — lo que nunca se negocia

### WhatsApp como CTA principal
```tsx
// El único botón verde de la app. Siempre este color, siempre este texto.
<a
  href={`https://wa.me/${phone.replace(/\D/g, '')}`}
  target="_blank"
  rel="noopener noreferrer"
  className="flex w-full items-center justify-center gap-2 rounded-[--radius-full]
             bg-[#25D366] py-3 font-bold text-white"
>
  Contactar por WhatsApp
</a>
```

- `#25D366` SOLO para WhatsApp — ningún otro elemento usa este color
- Prestadores en modo guardia: NO revelar WhatsApp directamente → redirigir a paywall
- Mensaje pre-cargado cuando es emergencia: codificar en el `href` con `?text=...`

### Mobile-first
- Ancho base: 390px (iPhone 14)
- Todo debe verse bien sin media queries: `max-w-xl mx-auto` en contenido principal
- Bottom nav fijo: siempre `pb-24` o `pb-32` en main
- Tap targets mínimos: 44px de alto
- `active:scale-95` o `active:scale-[0.98]` en todos los botones

### Idioma: español argentino
- Voseo: "¿Qué buscás?", "Ingresá", "Contactá", "Elegí"
- Nunca tuteo formal: ❌ "Seleccione su ciudad" → ✅ "Elegí tu ciudad"
- Moneda: siempre `formatARS()` de `@/shared/utils/formatARS` — nunca hardcodear "$35000"
- Teléfonos: formato `+549XXXXXXXXXX` en base de datos, mostrar como `+54 9 XXX XXX-XXXX`
- Zona horaria: `America/Argentina/Salta` (UTC-3, sin DST)

### Dark mode only
- Fondo siempre oscuro. Nunca fondos blancos ni grises claros.
- Todo es dark mode — no hay modo light, no hay toggle.

### Confianza visual
- Fotos reales (de Stitch/CDN), no placeholders grises
- Badge "✓ Verificado" visible cuando `isVerified: true`
- Rating con `font-mono`, estrella en `--color-bosque-lt`
- Bio con `line-clamp-2` — nunca truncar con "..."

---

## 13. Mock data — reglas para prestadores

Fuente de verdad: `src/data/mock-providers.ts`. 10 prestadores base (p1–p10).

### Al agregar prestadores
- ID secuencial: `p11`, `p12`, etc.
- Ordenar en el array por ciudad: San Martín primero, VLA segundo, Bariloche tercero
- Prefijo de teléfono: `+5492972` para SMA y VLA, `+5492944` para Bariloche
- Coordenadas: variar ±0.01 del centro de la ciudad
- Rating: 4.5–5.0 para verificados, 4.0–4.8 para no verificados. Nunca 5.0 a no verificados.
- totalJobs: proporcional al `createdAt` (ver tabla)
  - < 6 meses → 10–40 trabajos
  - 6–12 meses → 40–100 trabajos
  - > 1 año → 80–250 trabajos
- Bio: primera persona, tono coloquial argentino, ≤2 oraciones, especialidad concreta
- Nombres: combinaciones de nombres/apellidos de la región (Mapuche + españoles)
  - Nombres: Rodolfo, Mirta, Pablo, Héctor, Gustavo, Rosa, Nora, Jorge, Claudia
  - Apellidos: Quintana, Lagos, Mansilla, Pereyra, Orellano, Fuentes, Antiñir, Nahuel

### Distribución de planes sugerida
- 50% `profesional`, 25% `basico`, 15% `destacado`, 10% `null`

---

## 14. Hooks de datos

### useProviders(`src/features/providers/hooks/useProviders.ts`)

```ts
useProviders(filters?: {
  ciudad?: CiudadId
  rubro?: RubroId
  soloVerificados?: boolean
  soloConPlan?: boolean
}): { providers: Provider[], total: number, isEmpty: boolean }
```

Filtra `mockProviders` donde `status === 'active'`, aplica filtros opcionales, luego ordena:
```
destacado → profesional → basico → null → por rating desc dentro de cada grupo
```
**Pendiente:** agregar `isOnGuardia` como primer criterio cuando se implemente el campo.

Cuando llegue Supabase, solo se reemplaza el body del hook. Los componentes no cambian.

---

## 15. Formularios

### Patrón estándar (RHF + Zod)
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  campo: z.string().min(2, 'Mensaje de error en español'),
})
type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<FormData>({ resolver: zodResolver(schema) })
```

### Estilo de inputs
```tsx
// bg-[#090f14] para inputs (surface-container-lowest de Stitch)
<input
  className="w-full h-14 px-4 rounded-xl bg-[#090f14] text-[--color-nieve]
             placeholder:text-[#414845] focus:outline-none
             focus:ring-1 focus:ring-[rgba(173,206,192,0.4)]"
/>
```

Error: `ring-1 ring-[#ffb4ab]/60` + mensaje `text-xs` en `#ffb4ab`

---

## 16. Integración Stitch (deprecado)

Stitch fue la herramienta de diseño original. **Ya no se usa.** Las pantallas que
vinieron de ahí ya están adaptadas en `src/`; las referencias históricas a la paleta
Stitch en §10 quedan solo como documentación de los valores de color actuales.

No quedan credenciales ni tooling de Stitch en este repo. Si en el futuro se retoma
una integración externa, las credenciales van en `.env.local` (no trackeado) — nunca
en este archivo ni en ningún archivo versionado.

---

## 17. Imágenes

Todas en `public/images/`. Nombres en kebab-case.

| Archivo | Uso |
|---------|-----|
| `hero-lanin.png` | Hero de HomePage (volcán Lanín) |
| `onboarding-mountains.png` | Fondo OnboardingPage |
| `register-forest.png` | Hero ProviderRegisterPage |
| `emergency-map.png` | Fondo mapa EmergencyPage |
| `provider-marcos.png` | Foto prestador EmergencyPage |
| `provider-electricista.png` | FeaturedCard electricista |
| `provider-electricista2.png` | RubroPage electricista |
| `provider-carpintera.png` | FeaturedCard carpintera |
| `provider-carpintero2.png` | RubroPage carpintero |
| `provider-jardinero.png` | FeaturedCard jardinero |
| `provider-albanil.png` | RubroPage albañil |
| `user-avatar.png` | Avatar fallback |

Pedir imágenes en `=w1600` del CDN de Stitch para máxima resolución.

---

## 18. Lo que NUNCA hacer

### Arquitectura
- ❌ `export default` en componentes — siempre named export
- ❌ Importar desde otra feature directamente
- ❌ Lógica de negocio en componentes de `shared/`
- ❌ Tipos inline en componentes — van en `types.ts`
- ❌ Hardcodear strings de `CiudadId` o `RubroId` — usar los tipos inferidos
- ❌ Llamadas a Supabase/API en componentes — solo en hooks

### UI/UX
- ❌ Fondo blanco o gris claro — todo es dark mode
- ❌ `font-family: system-ui` o Arial — siempre las variables CSS
- ❌ Colores hardcodeados fuera de los casos documentados en §10
- ❌ `#25D366` para cualquier cosa que no sea WhatsApp
- ❌ Sombras de color brillante — solo `shadow-black/20` o similares
- ❌ Animaciones en cada elemento — solo hover lift en cards y transiciones de botones
- ❌ Texto centrado en bloques de más de 2 líneas
- ❌ Más de 2 colores de acento en la misma pantalla
- ❌ Cards sin estado hover
- ❌ `border-2` o más en cards normales — solo `border` (1px)
- ❌ Spinner de loading — usar skeleton screens (`animate-pulse`)
- ❌ Revelar WhatsApp de prestador en guardia sin pasar por paywall

### Código
- ❌ `any` en TypeScript
- ❌ Side effects en el cuerpo de render — siempre en `useEffect`
- ❌ `console.log` en producción (ok en mocks temporales con comentario `// TODO`)
- ❌ Agregar features, refactors o "mejoras" no pedidas
- ❌ Comentarios JSDoc en componentes que no los tenían
- ❌ `--no-verify` en git a menos que sea pedido explícitamente
- ❌ Mencionar "Junín de los Andes" — la ciudad es San Martín de los Andes

### Contenido
- ❌ Tuteo formal ("seleccione", "ingrese") — siempre voseo
- ❌ Precios hardcodeados — siempre `formatARS()`
- ❌ USD en cualquier contexto visible al usuario
- ❌ Texto placeholder ("Lorem ipsum", "Coming soon") en pantallas entregadas

---

## 19. Checklist antes de terminar cualquier tarea

- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Ruta nueva registrada en `Router.tsx` si aplica
- [ ] Named export (no default)
- [ ] Props type definido
- [ ] `navigate(-1)` para back buttons (no `navigate('/')`)
- [ ] WhatsApp usa `#25D366` y abre `wa.me/...`
- [ ] Precios usan `formatARS()`
- [ ] Copy en español voseante
- [ ] Screenshot en 390px de ancho si es una página nueva

---

## 20. Comandos útiles

```bash
# Dev server
npm run dev

# Type check
npx tsc --noEmit

# Screenshot headless
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new --screenshot=/tmp/page.png \
  --window-size=390,844 --virtual-time-budget=5000 \
  "http://localhost:3000/ruta"
```

---

*Última actualización: 2026-06-15*
