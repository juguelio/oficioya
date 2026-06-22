# Oficio — Estado de lanzamiento (2026-06-19)

Lectura honesta de cuánto falta para lanzar, hecha tras auditar código + DB + pipeline.

## Cómo lo veo: ~70% para un lanzamiento mínimo

El lanzamiento mínimo = un cliente entra, encuentra prestadores reales en su ciudad y
los contacta por WhatsApp; un prestador se da de alta solo. El pago de suscripción
puede ser **manual al principio** (el propio FAQ de `/planes` ya dice "transferencia o
Mercado Pago, te contactamos al registrarte"), así que MercadoPago NO bloquea el v1.

El único bloqueante duro del v1 es: **no hay prestadores reales en la base** (solo mock).

## Estado por pilar

| Pilar | Estado | % |
|-------|--------|---|
| App cliente (home, listados, perfiles, emergencias) | Completa, en Supabase, RLS, storage | ~90% |
| Onboarding prestador | Conversacional por agente en `/registro/prestador` + wizard clásico en `/registro/clasico` | ~90% |
| Esquema de datos | providers, cities, rubros, tiers, emergency_requests, outreach_log, prospects, reviews, certifications, auth trigger, storage | ~90% |
| Dashboard prestador | Cableado a Supabase (perfil real por auth_user_id + reseñas/certificaciones vía `useDashboardData`). Falta sólo flujo de reseñas de cliente | ~80% |
| **Oferta real (prestadores en DB)** | **0 reales — solo mock.** Crawl dio 26 prospectos (`ops/crawl/`) sin cargar | **~15%** |
| Pagos MercadoPago | Solo `.env` + columnas DB. Cero código. No bloquea v1 (pago manual) | ~10% |
| Outreach automatizado | Tabla `prospects` + plantillas + prompt de clasificación + **3 workflows n8n importables** + cierre de embudo automático (trigger DB `..012`). Falta sólo: cargar prospects, crear plantillas en Meta, conectar WhatsApp Business API + envs en n8n | ~60% |

## Hallazgo clave

El pipeline de captación por agente **ya estaba diseñado** en una sesión previa:
- `outreach_log` (migración) rastrea cada WhatsApp: mensaje enviado, respuesta, intent
  clasificado por Claude (`interested`/`not_now`/`registered`/…), follow-up, conversión.
- `.env.example` ya tiene `MP_ACCESS_TOKEN`, `WHATSAPP_API_URL/KEY` (360dialog),
  `N8N_BASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- `notifications.ts` ya postea a webhooks n8n (welcome email + alerta nuevo prestador).

O sea: la arquitectura para "crawl → outreach → onboarding por agente" está planteada.
Falta **cablearla y conectar las cuentas externas**.

## Camino crítico al v1 (en orden)

1. **Cargar oferta real** — el v1 vive o muere por esto. Opciones:
   - a) Completar el crawl (VLA, gasistas SMA, resto de rubros, tapar plomeros con otra
        fuente / Google Places API) → más prospectos.
   - b) Outreach compliant a esos prospectos (WhatsApp Business API + plantilla opt-in,
        o primer toque personalizado de bajo volumen) → que se den de alta solos por el
        onboarding conversacional.
   - Los prospectos NO se siembran en `providers` (el signup crea la fila vía trigger →
     duplicaría). Se rastrean por teléfono en `outreach_log` y se convierten al alta.
2. **Cuentas externas del usuario** (bloqueantes que no puedo resolver yo):
   - WhatsApp Business Platform (Meta/360dialog) para outreach + onboarding por WhatsApp.
   - Google Places API key para crawl a escala.
   - MercadoPago (sandbox alcanza para empezar) — opcional para v1, necesario para v2.
3. **Conectar n8n** — los flujos de outreach/clasificación/follow-up viven en n8n, no en
   el repo. Hay que construirlos/activarlos contra `outreach_log` y la WhatsApp API.
4. **MercadoPago en código (v2)** — Edge Function de checkout + webhook que actualiza
   `subscription_tier_id`. Hoy no existe (`supabase/functions/` no está).

## Hecho en esta sesión

- Refinamiento del repo (código muerto, UI, CLAUDE.md sincronizado, fix de datos). `tsc` limpio.
- Crawl piloto validado: 26 prospectos reales (`ops/crawl/`).
- Onboarding conversacional por agente, ya enlazado desde todos los CTAs (`/registro/prestador`).
- Migración `20260619000009`: el signup ahora persiste el `bio` del onboarding (antes se perdía).
- Fix de bugs (code-review + Codex): se guardaba mal el WhatsApp en el onboarding; login real caía en dashboard mock → ahora carga el prestador real desde Supabase por `auth_user_id`.
- **Motor de captación listo para cablear** (`ops/outreach/`): tabla `prospects` (migración `..10`),
  plantillas WhatsApp compliant, prompt de clasificación de respuestas, y diseño completo del
  flujo n8n (outbound / inbound / follow-up) contra `outreach_log`. Falta sólo conectar la
  cuenta de WhatsApp Business API y armar el flujo en n8n.

## Lo que necesito de vos para seguir

- ¿Arrancamos por completar el crawl (más prospectos, no depende de nadie) o por
  construir el flujo n8n de outreach (necesita tu cuenta de WhatsApp Business API)?
- Si querés MercadoPago en v1, pasame credenciales de sandbox y lo codeo.
