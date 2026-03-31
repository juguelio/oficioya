# SKILL: Oficio — Marketplace de Oficios para la Patagonia

## Descripción del Proyecto

**Oficio** es un marketplace hiperlocal que conecta clientes con trabajadores de oficios
(electricistas, plomeros, carpinteros, etc.) en el corredor patagónico:
San Martín de los Andes → Villa La Angostura → Bariloche.

Modelo de negocio tipo Uber/Rappi:
- **Clientes:** app gratuita
- **Proveedores (prestadores):** suscripción mensual en ARS

---

## Stack Técnico

| Capa | Tecnología | Motivo |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Velocidad de desarrollo, ecosistema |
| Estilos | Tailwind CSS v4 | Utility-first, design tokens nativos |
| Routing | React Router v7 | SPA con rutas tipadas |
| Estado global | Zustand | Simple, sin boilerplate |
| Forms | React Hook Form + Zod | Validación type-safe |
| Mapas | Mapbox GL JS | Mejor soporte offline/custom en Patagonia |
| Backend (fase 1) | Mock data local | Validar UX sin infra |
| Backend (fase 2) | Supabase | Auth, DB, Storage, Realtime |
| Deploy | Vercel | CI/CD automático desde GitHub |

---

## Estructura de Carpetas

```
oficio/
├── SKILL.md                    ← este archivo (contexto para Claude Code)
├── .claude/
│   └── commands/               ← slash commands personalizados
│       ├── new-feature.md
│       └── db-migration.md
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── Router.tsx
│   │   └── providers/          ← QueryClient, Auth, Theme
│   ├── features/               ← módulos por dominio de negocio
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store.ts
│   │   │   └── types.ts
│   │   ├── search/             ← buscar prestadores
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   └── ResultsGrid.tsx
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── providers/          ← perfil de prestadores
│   │   │   ├── components/
│   │   │   │   ├── ProviderCard.tsx
│   │   │   │   ├── ProviderProfile.tsx
│   │   │   │   └── VerifiedBadge.tsx
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── booking/            ← solicitar / agendar trabajo
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── reviews/
│   │   └── subscriptions/      ← planes para prestadores
│   │       ├── components/
│   │       │   └── PricingTable.tsx
│   │       └── types.ts
│   ├── shared/
│   │   ├── components/         ← UI primitivos reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Map.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── StarRating.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useGeolocation.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useDebounce.ts
│   │   ├── utils/
│   │   │   ├── formatARS.ts    ← formateador de pesos
│   │   │   ├── distance.ts     ← cálculo de distancia haversine
│   │   │   └── cn.ts           ← classnames util
│   │   └── types/
│   │       └── index.ts        ← tipos globales exportados
│   ├── design-system/
│   │   ├── tokens.ts           ← colores, tipografía, espaciado
│   │   └── theme.css           ← CSS variables
│   └── data/
│       ├── mock-providers.ts   ← datos de prueba de prestadores
│       ├── mock-cities.ts      ← ciudades y zonas
│       └── rubros.ts           ← categorías de oficios
├── public/
│   └── icons/
├── docs/
│   ├── PRD.md                  ← Product Requirements
│   ├── DECISIONS.md            ← ADRs (decisiones de arquitectura)
│   └── ROADMAP.md
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Dominios del Negocio

### Ciudades (fase 1)
- San Martín de los Andes (8037)
- Villa La Angostura (8407)
- Bariloche (8400)

### Rubros disponibles
`electricista` | `plomero` | `gasista` | `carpintero` | `albañil` |
`pintor` | `cerrajero` | `jardinero` | `calefaccionista` | `herrero`

### Roles de usuario
- `cliente` — busca y contacta prestadores
- `prestador` — ofrece servicios, tiene suscripción
- `admin` — gestiona la plataforma (solo interno)

---

## Modelos de Datos Clave

```typescript
// Prestador
interface Provider {
  id: string
  name: string
  rubro: Rubro
  ciudad: Ciudad
  barrio?: string
  phone: string           // WhatsApp primero
  rating: number          // 0-5
  totalJobs: number
  isVerified: boolean
  subscription: 'basico' | 'profesional' | 'destacado' | null
  lat?: number
  lng?: number
  bio?: string
  photos: string[]
  createdAt: Date
}

// Solicitud de trabajo
interface JobRequest {
  id: string
  clientId: string
  providerId: string
  rubro: Rubro
  description: string
  ciudad: Ciudad
  status: 'pending' | 'accepted' | 'in_progress' | 'done' | 'cancelled'
  createdAt: Date
}

// Reseña
interface Review {
  id: string
  jobId: string
  rating: number
  comment: string
  clientName: string      // sin cuenta completa en fase 1
  createdAt: Date
}
```

---

## Planes de Suscripción (en ARS)

| Plan | Precio/mes | Contactos | Badge | Prioridad |
|---|---|---|---|---|
| Básico | $15.000 | 8/mes | ✗ | Normal |
| Profesional | $35.000 | Ilimitados | ✓ | Alta |
| Destacado | $65.000 | Ilimitados | ✓ | Máxima + banner |

> Actualizar precios cada 3 meses según inflación.

---

## Convenciones de Código

- **Componentes:** PascalCase, un componente por archivo
- **Hooks:** `use` prefix, camelCase
- **Types:** sufijo `Type` para types, `Interface` evitarlo en favor de `type`
- **Archivos de barrel:** `index.ts` en cada carpeta de componentes
- **CSS:** Tailwind utility-first; no CSS modules salvo casos especiales
- **Imports:** absolutos desde `@/` (configurado en tsconfig)
- **Commits:** conventional commits — `feat:`, `fix:`, `chore:`, `docs:`

### Ejemplo de componente
```tsx
// src/features/providers/components/ProviderCard.tsx
import { type Provider } from '@/features/providers/types'
import { Badge, StarRating } from '@/shared/components'
import { formatDistance } from '@/shared/utils/distance'

type ProviderCardProps = {
  provider: Provider
  onContact: (id: string) => void
  userLat?: number
  userLng?: number
}

export function ProviderCard({ provider, onContact, userLat, userLng }: ProviderCardProps) {
  // ...
}
```

---

## UX / Producto

### Principios de diseño
1. **WhatsApp primero** — el CTA principal siempre es "Contactar por WhatsApp"
2. **Confianza visual** — fotos reales, reseñas verificadas, badge de verificado
3. **Hiperlocal** — siempre mostrar barrio/zona, no solo ciudad
4. **Mobile first** — el 90% del uso será desde el celular
5. **Offline graceful** — mostrar datos cacheados si no hay señal (Patagonia ≠ cobertura perfecta)

### Flujo cliente (happy path)
```
Abrir app → Seleccionar ciudad → Ver rubros →
Seleccionar rubro → Ver mapa + lista → Ver perfil →
Contactar por WhatsApp ✓
```

### Flujo prestador (happy path)
```
Landing → Registrarme → Completar perfil → Elegir plan →
Pagar (MercadoPago) → Recibir contactos ✓
```

---

## Flujo de Emergencia 24/7

### Para el cliente
1. Ve prestador con badge 🔴 "Disponible ahora" (en home, listado o perfil)
2. Click en cualquier CTA de ese prestador → paywall
3. Paywall muestra: nombre, rubro, rating, "Contacto de emergencia $20.000 ARS"
4. Paga con MercadoPago
5. Se revela el número de WhatsApp
6. Mensaje pre-cargado: "Hola [nombre], te contacto desde Oficio.
   Tengo una urgencia con [rubro] en [ciudad]. ¿Podés venir?"
7. Coordinan por WhatsApp directamente

### Para el prestador
1. Login en su panel
2. Activa toggle "Estoy disponible ahora 🔴"
3. Aparece destacado en home, listado y página de emergencias
4. Recibe contactos directamente por WhatsApp
5. Puede desactivar el toggle cuando no está disponible

### Reglas de negocio
- Badge 🔴 = paywall en TODOS los puntos de contacto sin excepción
- Precio: $20.000 ARS por contacto (revisar cada 3 meses)
- Pago ANTES de revelar el WhatsApp
- Garantía: si el prestador no responde en 10 min → crédito para próxima emergencia
- El modo guardia no depende del plan de suscripción — cualquier prestador puede activarlo
- Los prestadores en modo guardia aparecen SIEMPRE primero en todos los listados

### Stack de pagos
- MercadoPago para cobros en ARS
- Chat interno: NO (V2)
- Contacto: WhatsApp directo post-pago

### Prioridad de ordenamiento en listados
1. 🔴 En guardia ahora (cualquier plan)
2. ⭐ Destacado (plan destacado)
3. ✓ Profesional (plan profesional)
4. Básico
5. Sin plan
- Dentro de cada grupo: por rating descendente

---

## Integraciones Planeadas

| Integración | Cuándo | Motivo |
|---|---|---|
| WhatsApp Business API | Fase 1 | CTA principal de contacto |
| MercadoPago | Fase 1 | Cobro de suscripciones en ARS |
| Mapbox | Fase 1 | Mapa de prestadores por zona |
| Supabase Auth | Fase 2 | Login con teléfono/Google |
| Supabase Realtime | Fase 2 | Notificaciones en tiempo real |
| OneSignal | Fase 2 | Push notifications |

---

## Roadmap

### MVP (4-6 semanas)
- [ ] Landing page con propuesta de valor
- [ ] Listado de prestadores por ciudad y rubro
- [ ] Perfil de prestador con reseñas
- [ ] CTA a WhatsApp
- [ ] Página de planes (sin pago real aún)

### Beta (2-3 meses)
- [ ] Registro de prestadores
- [ ] Pago de suscripción con MercadoPago
- [ ] Panel del prestador (ver mis contactos)
- [ ] Sistema de reseñas verificadas
- [ ] Mapa interactivo

### V1.0 (6 meses)
- [ ] App móvil (React Native o PWA)
- [ ] Notificaciones push
- [ ] Chat interno (o redirect a WhatsApp)
- [ ] Panel de admin
- [ ] Expansión: Neuquén, Cipolletti, Centenario

---

## Notas Locales Importantes

- **Moneda:** siempre ARS (pesos argentinos), nunca USD en UI
- **Teléfonos:** formato argentino `+54 9 XXX XXX-XXXX`
- **Zonas horarias:** America/Argentina/Salta (UTC-3, sin DST)
- **Conectividad:** muchas zonas de Patagonia tienen 3G intermitente — diseñar para eso
- **Cultura laboral:** los "cuentapropistas" prefieren WhatsApp sobre formularios

---

*Última actualización: 2026-03-31 — agregado modelo de emergencias 24/7*
*Proyecto paralelo a: [publishing project de Eli]*
