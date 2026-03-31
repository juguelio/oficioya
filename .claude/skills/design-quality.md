# SKILL: design-quality

Criterios visuales y de UX para todas las pantallas de Oficio.
Leer este archivo antes de construir o modificar cualquier página o componente.

---

## El estándar mínimo

Cada pantalla debe pasar este test: **¿Parece una app de 2025 que alguien pagaría por usar?**

Si la respuesta es "más o menos" o "no sé", no está lista.

Referentes visuales a tener en cuenta:
- **Linear** — uso de espacio, tipografía, dark mode
- **Vercel dashboard** — densidad de información, jerarquía
- **Airbnb** — cards de servicios, confianza visual
- **Rappi / PedidosYa** — flujo mobile, CTAs claros

---

## Tipografía

```css
/* Títulos de página, hero */
font-family: var(--font-display); /* Playfair Display */
font-weight: 700 o 900;
letter-spacing: -0.03em; /* siempre tracking negativo en títulos grandes */

/* Cuerpo, labels, botones */
font-family: var(--font-body); /* Raleway */
font-weight: 500 (cuerpo) / 600 (labels) / 700 (botones)

/* Precios, stats, números */
font-family: var(--font-mono); /* JetBrains Mono */
font-variant-numeric: tabular-nums;
```

### Escala tipográfica
| Uso | Tamaño | Peso |
|---|---|---|
| Hero / H1 | `text-4xl` a `text-6xl` | 900 |
| H2 sección | `text-2xl` a `text-3xl` | 700 |
| H3 card | `text-base` a `text-lg` | 600 |
| Body | `text-sm` a `text-base` | 400-500 |
| Label / caption | `text-xs` | 600, tracking wide |
| Precio | `text-3xl` a `text-5xl` | 700, font-mono |

---

## Color y contraste

Usar **siempre** las CSS variables — nunca colores hardcodeados.

```css
/* Fondos en capas — crear profundidad */
--color-noche    /* #0E1510 — fondo base */
--color-sombra   /* #1A2A1A — cards, panels */
#1E2E1E          /* bordes sutiles */
#2A3A2A          /* bordes hover */

/* Texto */
--color-nieve    /* texto principal */
--color-muted    /* texto secundario, captions */

/* Acento */
--color-bosque-lt  /* primario — botones, links activos, highlights */
--color-lago       /* secundario — info, badges */
#F5C842            /* amarillo — warnings, destacado premium */
#25D366            /* WhatsApp verde — solo para ese CTA */
```

### Jerarquía visual con color
1. **Un solo color de acento dominante por pantalla** — no mezclar bosque + lago + amarillo juntos
2. El color más saturado va al CTA principal
3. Todo lo demás en escala de grises verdosos

---

## Espaciado y layout

### Reglas de espaciado
```
Padding de página:    px-4 (mobile) / px-6 (tablet) / px-8 (desktop)
Gap entre cards:      gap-3 (mobile) / gap-4 (desktop)
Padding interno card: p-4 (standard) / p-5 (cards destacadas)
Sección spacing:      py-10 (mobile) / py-16 (desktop)
```

### Grid de cards
```tsx
/* Una columna en mobile, dos en tablet, tres en desktop */
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

/* Para listas densas (providers) */
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
```

### Máximos de ancho
```
Contenido full:     max-w-7xl mx-auto
Contenido normal:   max-w-5xl mx-auto
Texto / forms:      max-w-xl mx-auto
```

---

## Componentes con buen diseño

### Cards de prestador
- **Borde sutil** `border border-[#1E2E1E]` por default
- **Hover lift** `hover:-translate-y-1 hover:border-[--color-bosque-lt]`
- **Sombra en hover** `hover:shadow-lg hover:shadow-black/20`
- Avatar con color determinístico (no placeholder gris)
- Badge "✓ verificado" siempre visible si aplica
- Bio con `line-clamp-2` — no truncar con "..."
- Stats en font-mono para alinear números

### Botones
- **Nunca** botón sin estado hover explícito
- **Nunca** botón full-width en desktop dentro de un contenedor ancho
- WhatsApp button: siempre verde `#25D366`, con ícono SVG, texto "Contactar por WhatsApp"
- Botones primarios: padding generoso `px-6 py-3`

### Headers de página
Estructura estándar:
```tsx
<header>
  {/* Breadcrumb / back */}
  <nav> ← Ciudad / Rubro </nav>
  
  {/* Título */}
  <h1 style={{ fontFamily: 'var(--font-display)' }}>
    {emoji} {label} en {ciudad}
  </h1>
  
  {/* Subtítulo con conteo */}
  <p className="text-[--color-muted]">
    {total} profesionales disponibles
  </p>
</header>
```

### Estados vacíos
No usar texto plano. Estructura:
```tsx
<div className="text-center py-16">
  <span className="text-5xl">🔍</span>
  <h3>Sin resultados todavía</h3>
  <p className="text-[--color-muted]">Estamos sumando profesionales en esta zona.</p>
  <Button variant="secondary">Ver otros rubros</Button>
</div>
```

### Loading states
Usar skeleton screens, no spinners:
```tsx
<div className="animate-pulse rounded-[--radius-lg] bg-[--color-sombra] h-48" />
```

---

## Detalles que marcan la diferencia

### Separadores de sección
```tsx
/* No usar <hr>. Usar espacio + label en mayúsculas */
<div className="flex items-center gap-3 my-8">
  <div className="flex-1 h-px bg-[#1E2E1E]" />
  <span className="text-xs font-bold tracking-widest text-[--color-muted]">
    DESTACADOS
  </span>
  <div className="flex-1 h-px bg-[#1E2E1E]" />
</div>
```

### Precios en ARS
```tsx
/* Siempre con formatARS(), nunca hardcodeado */
import { formatARS } from '@/shared/utils/formatARS'

<span style={{ fontFamily: 'var(--font-mono)' }}>
  {formatARS(35000)}  {/* → $ 35.000 */}
</span>

/* Para precios grandes en pricing page */
<div>
  <span className="text-xs text-[--color-muted]">por mes</span>
  <div className="text-4xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
    {formatARS(35000)}
  </div>
</div>
```

### Badges y pills
```tsx
/* Label de sección antes de título */
<p className="text-xs font-bold tracking-[0.15em] text-[--color-bosque-lt] uppercase mb-2">
  Para profesionales
</p>
<h2>Elegí tu plan</h2>
```

### Gradientes sutiles
```css
/* Fondo de hero o sección especial */
background: radial-gradient(ellipse at top, #1A2A1A 0%, #0E1510 60%);

/* Borde iluminado en card destacada */
border: 1px solid transparent;
background: linear-gradient(#1A2A1A, #1A2A1A) padding-box,
            linear-gradient(135deg, #5B8C5A, transparent) border-box;
```

---

## Checklist antes de hacer PR

- [ ] Probé en 375px de ancho (iPhone SE) — ¿se ve bien?
- [ ] Probé en 1280px — ¿el layout escala bien?
- [ ] ¿Hay al menos 3 niveles de jerarquía tipográfica visible?
- [ ] ¿Los números usan font-mono?
- [ ] ¿Los precios usan formatARS()?
- [ ] ¿El CTA principal es obvio sin tener que buscarlo?
- [ ] ¿Los estados vacíos tienen diseño, no solo texto?
- [ ] ¿Hay hover states en todos los elementos interactivos?
- [ ] ¿El contraste de texto es suficiente? (muted sobre sombra está bien, muted sobre noche también)

---

## Lo que NUNCA hacer

- ❌ Fondo blanco o gris claro — todo es dark mode
- ❌ Colores hardcodeados fuera de los casos documentados arriba
- ❌ `font-family: system-ui` o `Arial` — siempre las variables
- ❌ Borders muy gruesos (`border-2` o más) en cards normales
- ❌ Sombras de color brillante — solo `shadow-black/20` o similares
- ❌ Animaciones en cada elemento — solo hover lift en cards y transiciones de botones
- ❌ Texto centrado en bloques de más de 2 líneas
- ❌ Más de 2 colores de acento en la misma pantalla
- ❌ Cards sin estado hover
- ❌ Íconos de emoji solos como único elemento visual en estados vacíos (acompañar con texto siempre)
