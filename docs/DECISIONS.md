# Decisiones de Arquitectura (ADRs)

---

## ADR-001 — WhatsApp primero como canal de contacto

**Estado:** Aceptado

**Contexto:** Los prestadores de oficios en la Patagonia ya usan WhatsApp como herramienta de trabajo principal. Implementar un chat interno requiere infraestructura y adopción adicional.

**Decisión:** El CTA principal en todas las pantallas es un botón de WhatsApp con mensaje pre-cargado. No hay formulario de contacto en Fase 1.

**Consecuencias:** Métricas de contacto dependen de la apertura de WhatsApp (no trackeable de forma nativa). Se compensa con conteo de clics antes del redirect.

---

## ADR-002 — Mock data → Supabase en dos fases

**Estado:** Aceptado

**Contexto:** Validar el producto sin invertir en infraestructura backend.

**Decisión:**
- Fase 1: datos en `src/data/mock-providers.ts`, sin auth ni base de datos real.
- Fase 2: migrar a Supabase (Postgres + Auth + Storage + Realtime).

**Consecuencias:** La capa de datos debe estar abstraída detrás de hooks (`useProviders`, etc.) para que la migración sea transparente para los componentes.

---

## ADR-003 — Moneda exclusiva en ARS

**Estado:** Aceptado

**Contexto:** El mercado objetivo es Argentina. Mostrar precios en USD generaría confusión y desconfianza.

**Decisión:** Todos los precios se muestran en pesos argentinos usando `Intl.NumberFormat('es-AR', { currency: 'ARS' })`. Nunca mostrar USD en la UI.

**Consecuencias:** Los precios de suscripción deben actualizarse cada 3 meses para ajustar por inflación.
