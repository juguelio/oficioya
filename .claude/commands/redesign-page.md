# redesign-page

Rediseña una página existente para que cumpla el estándar visual de Oficio.

## Instrucciones

1. Leé `.claude/skills/design-quality.md` completo antes de tocar cualquier código.
2. Leé `.claude/skills/component-conventions.md` para recordar las convenciones.
3. Leé el archivo de la página a rediseñar.

## Qué mejorar siempre

- Tipografía: aplicar escala, tracking negativo en títulos, font-mono en números
- Espaciado: padding de página, gaps entre elementos, secciones con respiro
- Jerarquía: al menos 3 niveles visuales claros por pantalla
- Estados: hover en todo lo interactivo, empty state con diseño, loading skeleton
- Profundidad: capas de fondo (noche → sombra → card), bordes sutiles
- CTA: el botón principal tiene que ser obvio sin buscarlo

## Qué NO cambiar

- La lógica de negocio y los hooks
- Los imports y la estructura de features
- Los tipos TypeScript

## Uso

```
/redesign-page HomePage
/redesign-page RubroPage
/redesign-page PricingPage
```

## Al terminar

Confirmá qué cambios visuales específicos hiciste y por qué.
