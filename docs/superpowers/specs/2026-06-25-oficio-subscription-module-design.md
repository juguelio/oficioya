# Diseño — Módulo de suscripción de prestadores (MercadoPago, débito automático)

**Fecha:** 2026-06-25 · **Proyecto:** Oficio (oficioya.app) · **Estado:** aprobado, pendiente de implementación
**Contexto:** se construye AHORA pero queda **dormido** para el lanzamiento gratis (flag off). Se prende cuando "se empiece a mover" (flag on + token MP de producción).

## 1. Objetivo

Permitir que un prestador se suscriba a un plan mensual (Básico / Profesional / Destacado) con **débito automático** vía MercadoPago Suscripciones (preapproval). La suscripción determina el `subscription_tier_id` del prestador, que ya gobierna el orden en los listados. Incluye alta y cancelación.

**No-objetivos:** prorrateos, cambios de plan mid-cycle con crédito, cupones, facturación AFIP. (YAGNI — se agregan si el negocio lo pide.)

## 2. Modelo de cobro

**MercadoPago Suscripciones — `preapproval` con `auto_recurring` mensual.** El prestador autoriza una vez (Checkout de MP con tarjeta); MP debita `price_ars` del tier cada mes automáticamente y notifica vía webhook. Elegido sobre el pago mensual manual por retención (no depende de que el prestador se acuerde de re-pagar).

## 3. Estructura de datos

### Reusa lo existente
- **`subscription_tiers`** (ya poblada): `id` (basico/profesional/destacado), `label`, `price_ars` (20000/35000/55000), `contacts_per_month`, `has_badge`, `priority`. Fuente de verdad de precios.
- **`providers.subscription_tier_id`** (text): el **entitlement**. Ya ordena los listados (`useProviders`). Lo escribe el webhook.

### Nueva tabla (1 migración)
`provider_subscriptions` — NO colisiona con `realtime.subscription` (interna de Supabase).

| col | tipo | nota |
|-----|------|------|
| `id` | uuid PK | `gen_random_uuid()` |
| `provider_id` | uuid FK → providers(id) on delete cascade | |
| `tier_id` | text FK → subscription_tiers(id) | |
| `mp_preapproval_id` | text unique | id del preapproval en MP |
| `status` | text check (pending/authorized/paused/cancelled) | default 'pending' |
| `current_period_end` | timestamptz null | próximo cobro, del webhook |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |

**RLS idéntica a `emergency_contacts`:** `enable row level security` + SIN policies + `revoke all from anon, authenticated`. Solo el service_role (edge functions) lee/escribe. El front nunca lee esta tabla directo; el estado de suscripción se expone vía una función/columna segura (ver §5).

Índices: `(provider_id, created_at desc)`, `(mp_preapproval_id)`.

## 4. Edge functions (patrón de emergencias: token MP solo server-side)

### `subscription-checkout`
- Input: `{ providerId, tierId }`.
- Valida: el prestador existe y está activo; el tier existe.
- Lee `price_ars` de `subscription_tiers`.
- Crea un **preapproval** en MP: `auto_recurring { frequency: 1, frequency_type: 'months', transaction_amount: price_ars, currency_id: 'ARS' }`, `payer_email`, `back_url` al dashboard, `reason`, `external_reference` = id de la fila.
- Inserta fila `provider_subscriptions` (status pending).
- Devuelve `{ init_point }`.

### `subscription-webhook`
- Endpoint de notificaciones de MP (`type=subscription_preapproval` y `subscription_authorized_payment`).
- **Anti-spoofing:** ante cada notificación, hace GET a la API de MP con el id recibido y trabaja con la respuesta de MP (no confía en el body).
- Transiciones:
  - preapproval `authorized` → `provider_subscriptions.status='authorized'`, set `current_period_end`, y `providers.subscription_tier_id = tier_id`.
  - `authorized_payment` (cobro mensual ok) → actualiza `current_period_end`.
  - preapproval `paused`/`cancelled` → `status` correspondiente y `providers.subscription_tier_id = null` (pierde placement premium).
- Idempotente (re-procesar la misma notificación no cambia el resultado).

### `subscription-cancel`
- Input: `{ providerId }` (autenticado — ver nota de auth abajo).
- Hace PUT al preapproval en MP con `status: 'cancelled'`.
- El webhook posterior refleja el estado final (fuente de verdad = MP).

**Nota de auth:** `subscription-cancel` debe ejecutarse en nombre del prestador logueado. La function valida el JWT de Supabase del request y deriva el `provider_id` por `auth_user_id` (no confía en el body para identidad).

## 5. Frontend

### Flag dormido — `VITE_SUBSCRIPTIONS_ENABLED` (default `false`)
- **Off (lanzamiento gratis):** `/planes` muestra los 3 planes con CTA **"Gratis durante el lanzamiento 🎉"** (deshabilitado para cobro). Las edge functions están deployadas pero el front no las invoca.
- **On:** CTA real **"Suscribirme"** → `subscription-checkout` → redirect a MP.

### `/planes` (PricingPage, ya existe)
Agrega el CTA por tier gobernado por el flag.

### Dashboard (`ProviderDashboard`)
Tarjeta "Tu suscripción": tier actual, estado, próximo cobro (`current_period_end`), botón **Cancelar** → `subscription-cancel`. El estado se obtiene vía una RPC `get_my_subscription()` (security definer, filtra por `auth_user_id`) o leyendo `providers.subscription_tier_id` + una vista segura — NO leyendo `provider_subscriptions` con anon.

### Hook
`useSubscription()` — encapsula leer el estado y disparar checkout/cancel. Una feature no importa de otra (regla del repo): vive en `features/subscriptions/`.

## 6. Lanzamiento gratis y grandfathering
- Flag off → nadie paga; los `subscription_tier_id` actuales se respetan y siguen ordenando.
- Al prender (flag on + token MP prod): nuevos prestadores se suscriben para placement premium. Los existentes con tier manual se migran o se les pide suscribirse (decisión operativa, fuera de este módulo).

## 7. Testing (verificación E2E, igual que emergencias)
En MP **test mode** con `VITE_SUBSCRIPTIONS_ENABLED=true` local:
1. `/planes` → "Suscribirme" Profesional → preapproval checkout (tarjeta APRO) → autorizado.
2. Webhook setea `provider_subscriptions.status='authorized'` + `providers.subscription_tier_id='profesional'`.
3. Dashboard muestra "Suscripto · Profesional · próximo cobro <fecha>".
4. Cancelar → MP cancela → webhook → `status='cancelled'`, `subscription_tier_id=null`.
5. **Seguridad:** anon → 401 sobre `provider_subscriptions` (como emergency_contacts).

Limitación honesta: el débito **recurrente** real solo se observa con el correr de los meses; en test se verifica la autorización, el primer `authorized_payment` y el entitlement.

## 8. Archivos
- Migración: `supabase/migrations/<ts>_provider_subscriptions.sql` (+ RPC `get_my_subscription`).
- Edge functions: `supabase/functions/subscription-checkout/`, `subscription-webhook/`, `subscription-cancel/`.
- Frontend: `features/subscriptions/` (hook + componentes), cambios en `PricingPage` y `ProviderDashboard`.
- Config: `VITE_SUBSCRIPTIONS_ENABLED` en `.env.example` / `.env.production.example`; secrets MP ya existen.

## 9. Riesgos
- **MP preapproval requiere cuenta MP habilitada para Suscripciones** — confirmar en la cuenta de prod antes de prender.
- **Token de prueba en prod** hoy: el módulo se prueba en test mode; para cobro real se requiere el token de producción (dependencia externa, la pone Joaquín).
- Webhooks: configurar la URL de `subscription-webhook` en el panel de MP al prender.
