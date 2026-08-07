# PROJECTS

Control central de los 3 proyectos activos.

---

## 1. Oficio — Marketplace de oficios Patagonia
**Estado:** 🟡 Pre-lanzamiento. Plataforma ~85% lista para la cohorte de validación (solo SMA). Blocker técnico: MercadoPago en TEST en prod.
**Stack:** React + Vite + TypeScript + Tailwind + Supabase. Deploy: Vercel (proyecto único `oficioya` → oficioya.app).
**Repo:** `~/Dev/oficio` (GitHub `juguelio/oficioya`)
**Prioridad ahora:** (1) outbound WhatsApp de los links de claim a los 99 perfiles sin reclamar, (2) MP TEST→prod, (3) abrir cohorte fundadora SMA y medir.

### Qué está listo (en prod)
- App React/Vite/TS completa, design system light "Azul Andino", light/dark del hero de emergencias.
- Supabase: auth, DB, storage KYC privado, realtime para modo guardia. `useProviders`/dashboard/jobs leen de Supabase (no mock).
- Ingesta Google Places → 99 prospects válidos (+549, rubro/ciudad ok).
- **Perfiles reclamables**: web poblada día 1, WhatsApp enmascarado hasta el claim. Flujo `/activar/:id#t=token` (claim de un toque) construido y verificado e2e. Vista `providers_public` con gate PII.
- Paywall de emergencias §8 ($20k ARS/contacto) live.
- Módulo de suscripción MP (preapproval mensual) construido — **dormido tras feature flag**.
- Fixes de seguridad + referral loop mergeados. Mapa de emergencias funcionando.
- Infra Vercel consolidada: 1 repo → 1 proyecto → 1 dominio (ver [[Vercel-Dedup-Maps-Fix-2026-06-25]]).
- QA pre-cliente 2026-07-02: paywall de guardia enforzado en perfil+listado (antes se salteaba), fix "★ 0.0" en cards de unclaimed, fix input invisible en `/activar/:id` (ver [[QA-Pre-Cliente-2026-07-02]]).
- QA 2026-07-15: cerrados pendientes #3–#6 (deuda técnica, sin cambios de precio/diseño). Precios a fuente única `src/shared/config/plans.ts` (inflación = 1 archivo); `toProvider`→`shared/utils`, tipo `Provider` en search vía `@/shared/types`, cross-feature restantes documentados como excepción; `ProviderCard` muerto borrado; acentos fuera de paleta → var CSS en ConversationalOnboarding/PricingPage. `tsc --noEmit` limpio. Migración 021 y flujo de guardia intactos (ver [[QA-Pre-Cliente-2026-07-02]] Update 2026-07-15).

### Próximo paso
- **Outbound WhatsApp**: hacerles llegar `/activar/:id#t=token` a los 99 unclaimed (decisión de diseño en curso).
- MercadoPago: pasar de token TEST a producción (emergencias + activar flag de suscripciones).
- Google OAuth + verificación admin de KYC (hoy manual vía dashboard).
- Migrar Baileys/nada → WhatsApp Business API cuando haya volumen (no bloquea validación).
- ~~Reseñas a Supabase + sacar fallback mock de `/prestador/:id`~~ ✅ 2026-07-02: perfil lee/escribe reseñas reales (`useReviews` + RPC `submit_review`, migración `..021`); fallback mock eliminado. La misma migración enmascara el `whatsapp_number` de prestadores en guardia server-side en `providers_public`. **Aplicar `supabase db push` antes del próximo deploy.**

### Decisiones tomadas
- WhatsApp como CTA principal. Suscripción solo prestadores, clientes gratis.
- Precios: Básico $20k / Profesional $35k / Destacado $55k ARS (revisar cada 3 meses).
- Validación de oferta antes que más código: solo SMA, cohorte fundadora gratis mientras arrancamos (aviso 30 días antes de cobrar), MP en fase 2. Métrica: ≥15 prestadores verificados + ≥50 clics WhatsApp/semana en 30 días.

---

## 2. Proyecto Eli — Publishing
**Estado:** 🟢 Avanzado
**Prioridad ahora:** n8n + optimización de audios

### Notas
- Workflows de n8n en optimización
- Audio pipeline activo

---

## 3. [Tercer proyecto]
**Estado:** ⚪ Por definir

---

## Reglas de trabajo
- Un proyecto por sesión de Claude Code si es posible
- Cada proyecto tiene su propio SKILL.md con contexto completo
- Los commands en .claude/commands/ son la interfaz principal con Claude Code
- Los precios de Oficio se revisan cada 3 meses (inflación ARS)
