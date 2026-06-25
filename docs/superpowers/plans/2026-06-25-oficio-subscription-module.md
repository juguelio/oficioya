# Módulo de suscripción de prestadores — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un prestador se suscriba a un plan mensual con débito automático vía MercadoPago (preapproval), con alta, webhook de estado y cancelación; dormido para el lanzamiento gratis.

**Architecture:** Mismo patrón que el paywall de emergencias (token MP solo server-side en edge functions; tabla con RLS blindada a service_role; entitlement en `providers.subscription_tier_id`). 3 edge functions (checkout/webhook/cancel) + 1 migración + frontend gobernado por un flag.

**Tech Stack:** React 18 + Vite + TS, Supabase (Postgres + Edge Functions Deno), MercadoPago Suscripciones (preapproval).

## Global Constraints (verbatim del spec / CLAUDE.md del repo)
- **Sin framework de tests** en el repo → verificación = `npx tsc --noEmit` + **E2E runtime** (Playwright + `supabase db query --linked`) en **MP test mode**. NO inventar unit tests.
- Token MP **solo server-side** (edge functions). Nunca en el bundle del browser.
- RLS de `provider_subscriptions` **idéntica a `emergency_contacts`**: enable RLS, sin policies, `revoke all from anon, authenticated`.
- Entitlement = `providers.subscription_tier_id` (text). Lo escribe **solo** el webhook.
- Una feature no importa de otra; código nuevo en `src/features/subscriptions/`. Named exports. Voseo es-AR. `formatARS()` para precios. Colores via `var(--color-*)`.
- Flag `VITE_SUBSCRIPTIONS_ENABLED` default `false` (dormido).
- Commits frecuentes, **locales** (sin push — deploy único al final con OK de Joaquín).
- Migración aplicada con `supabase db query --linked -f <archivo>`; functions con `supabase functions deploy <slug>`.

---

### Task 1: Migración `provider_subscriptions` + RPC `get_my_subscription`

**Files:**
- Create: `supabase/migrations/20260625000020_provider_subscriptions.sql`

**Interfaces:**
- Produces: tabla `provider_subscriptions(id, provider_id, tier_id, mp_preapproval_id, status, current_period_end, created_at, updated_at)`; RPC `get_my_subscription()` → `{ tier_id, status, current_period_end }` del prestador logueado.

- [ ] **Step 1: Escribir la migración**

```sql
-- Suscripción de prestadores (MP preapproval, débito automático). Mismo blindaje PII que
-- emergency_contacts: RLS sin policies + revoke → solo service_role (edge functions) accede.
create table if not exists provider_subscriptions (
  id                 uuid        primary key default gen_random_uuid(),
  provider_id        uuid        not null references providers(id) on delete cascade,
  tier_id            text        not null references subscription_tiers(id),
  mp_preapproval_id  text        unique,
  status             text        not null default 'pending'
                                 check (status in ('pending','authorized','paused','cancelled')),
  current_period_end timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists provider_subscriptions_provider_idx on provider_subscriptions (provider_id, created_at desc);
create index if not exists provider_subscriptions_preapproval_idx on provider_subscriptions (mp_preapproval_id);

alter table provider_subscriptions enable row level security;
revoke all on provider_subscriptions from anon, authenticated;

-- El prestador logueado consulta SU estado sin leer la tabla directo (security definer,
-- filtra por auth_user_id). Devuelve la suscripción más reciente.
create or replace function get_my_subscription()
returns table (tier_id text, status text, current_period_end timestamptz)
language sql security definer set search_path = public as $$
  select ps.tier_id, ps.status, ps.current_period_end
  from provider_subscriptions ps
  join providers p on p.id = ps.provider_id
  where p.auth_user_id = auth.uid()
  order by ps.created_at desc
  limit 1
$$;
revoke all on function get_my_subscription() from anon;
grant execute on function get_my_subscription() to authenticated;
```

- [ ] **Step 2: Aplicar al remoto linkeado**

Run: `supabase db query --linked -f supabase/migrations/20260625000020_provider_subscriptions.sql`
Expected: sin error.

- [ ] **Step 3: Verificar tabla + RLS (anon bloqueado)**

Run: `URL=$(grep ^VITE_SUPABASE_URL= .env.local|cut -d= -f2-); ANON=$(grep ^VITE_SUPABASE_ANON_KEY= .env.local|cut -d= -f2-); curl -s -o /dev/null -w '%{http_code}\n' "$URL/rest/v1/provider_subscriptions?select=*" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"`
Expected: `401` (permission denied).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260625000020_provider_subscriptions.sql
git commit -m "feat(sub): tabla provider_subscriptions + RPC get_my_subscription (RLS blindada)"
```

---

### Task 2: Edge function `subscription-checkout`

**Files:**
- Create: `supabase/functions/subscription-checkout/index.ts`

**Interfaces:**
- Consumes: tabla `provider_subscriptions`, `subscription_tiers.price_ars`, secret `MP_ACCESS_TOKEN`, `APP_URL`.
- Produces: `POST { providerId, tierId, payerEmail } → { init_point }`. Crea preapproval MP + fila pending.

- [ ] **Step 1: Escribir la function** (basada en `emergency-checkout`)

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  try {
    const { providerId, tierId, payerEmail } = await req.json()
    if (!providerId || !tierId) return json({ error: 'missing_params' }, 400)
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN'); if (!mpToken) return json({ error: 'mp_not_configured' }, 503)
    const appUrl = Deno.env.get('APP_URL') ?? new URL(req.url).origin
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: provider } = await supabase.from('providers').select('id, status').eq('id', providerId).eq('status', 'active').maybeSingle()
    if (!provider) return json({ error: 'provider_unavailable' }, 404)
    const { data: tier } = await supabase.from('subscription_tiers').select('id, label, price_ars').eq('id', tierId).maybeSingle()
    if (!tier) return json({ error: 'tier_unknown' }, 404)

    const { data: sub, error: insErr } = await supabase.from('provider_subscriptions')
      .insert({ provider_id: provider.id, tier_id: tier.id, status: 'pending' }).select('id').single()
    if (insErr || !sub) return json({ error: 'could_not_create' }, 500)

    const pre = {
      reason: `Oficio — Plan ${tier.label}`,
      external_reference: sub.id,
      payer_email: payerEmail ?? undefined,
      auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: tier.price_ars, currency_id: 'ARS' },
      back_url: `${appUrl}/dashboard?sub=ok`,
      status: 'pending',
    }
    const mpRes = await fetch('https://api.mercadopago.com/preapproval', { method: 'POST', headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(pre) })
    const mp = await mpRes.json()
    if (!mpRes.ok || !mp.init_point) return json({ error: 'mp_error', detail: mp }, 502)
    await supabase.from('provider_subscriptions').update({ mp_preapproval_id: String(mp.id ?? '') }).eq('id', sub.id)
    return json({ init_point: mp.init_point })
  } catch (_e) { return json({ error: 'bad_request' }, 400) }
})
```

- [ ] **Step 2: Deploy**

Run: `supabase functions deploy subscription-checkout`
Expected: `Deployed Function subscription-checkout`.

- [ ] **Step 3: Verificar error controlado (tier inexistente)**

Run: invocar vía `curl` con `{ "providerId":"<un active>", "tierId":"noexiste" }` (apikey anon) → Expected JSON `{"error":"tier_unknown"}` status 404. (Confirma que la function corre y valida; el happy-path se prueba en Task 7.)

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/subscription-checkout/index.ts
git commit -m "feat(sub): edge function subscription-checkout (preapproval mensual)"
```

---

### Task 3: Edge function `subscription-webhook`

**Files:**
- Create: `supabase/functions/subscription-webhook/index.ts`

**Interfaces:**
- Consumes: notificaciones MP (`type` + `data.id`), API MP `/preapproval/{id}`, secret `MP_ACCESS_TOKEN`.
- Produces: actualiza `provider_subscriptions.status`/`current_period_end` + `providers.subscription_tier_id`. Idempotente.

- [ ] **Step 1: Escribir la function**

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const ok = () => new Response('ok', { status: 200 })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 })
  try {
    const body = await req.json().catch(() => ({}))
    const url = new URL(req.url)
    const type = body.type ?? body.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic')
    const id = body?.data?.id ?? url.searchParams.get('id') ?? body?.id
    if (!id) return ok()
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN'); if (!mpToken) return ok()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const auth = { Authorization: `Bearer ${mpToken}` }

    // Resolver el preapproval (anti-spoofing: leemos a MP, no confiamos en el body).
    let preapprovalId = String(id)
    if (String(type).includes('authorized_payment')) {
      const r = await fetch(`https://api.mercadopago.com/authorized_payments/${id}`, { headers: auth })
      if (r.ok) { const ap = await r.json(); preapprovalId = String(ap.preapproval_id ?? preapprovalId) }
    }
    const pr = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, { headers: auth })
    if (!pr.ok) return ok()
    const pre = await pr.json()
    const ref = String(pre.external_reference ?? '')
    if (!ref) return ok()

    const statusMap: Record<string, string> = { authorized: 'authorized', paused: 'paused', cancelled: 'cancelled', pending: 'pending' }
    const status = statusMap[String(pre.status)] ?? 'pending'
    const nextEnd = pre.next_payment_date ? new Date(pre.next_payment_date).toISOString() : null

    const { data: sub } = await supabase.from('provider_subscriptions').select('id, provider_id, tier_id').eq('id', ref).maybeSingle()
    if (!sub) return ok()
    await supabase.from('provider_subscriptions').update({ status, current_period_end: nextEnd, mp_preapproval_id: preapprovalId, updated_at: new Date().toISOString() }).eq('id', sub.id)
    await supabase.from('providers').update({ subscription_tier_id: status === 'authorized' ? sub.tier_id : null }).eq('id', sub.provider_id)
    return ok()
  } catch (_e) { return ok() }
})
```

- [ ] **Step 2: Deploy con `--no-verify-jwt`** (MP no manda JWT de Supabase)

Run: `supabase functions deploy subscription-webhook --no-verify-jwt`
Expected: deployado.

- [ ] **Step 3: Verificar que responde 200 a un POST vacío** (no rompe; el efecto real se prueba en Task 7)

Run: `curl -s -o /dev/null -w '%{http_code}\n' -X POST "<FUNCTIONS_URL>/subscription-webhook" -H 'content-type: application/json' -d '{}'`
Expected: `200`.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/subscription-webhook/index.ts
git commit -m "feat(sub): edge function subscription-webhook (estado + entitlement, idempotente)"
```

---

### Task 4: Edge function `subscription-cancel`

**Files:**
- Create: `supabase/functions/subscription-cancel/index.ts`

**Interfaces:**
- Consumes: JWT de Supabase del prestador (header Authorization), API MP PUT `/preapproval/{id}`.
- Produces: `POST {} (con Authorization) → { ok: true }`. Cancela el preapproval del prestador logueado.

- [ ] **Step 1: Escribir la function** (deriva el provider del JWT, no del body)

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN'); if (!mpToken) return json({ error: 'mp_not_configured' }, 503)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // Cliente con el JWT del usuario para resolver identidad.
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'unauthorized' }, 401)
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: provider } = await admin.from('providers').select('id').eq('auth_user_id', user.id).maybeSingle()
    if (!provider) return json({ error: 'no_provider' }, 404)
    const { data: sub } = await admin.from('provider_subscriptions').select('id, mp_preapproval_id').eq('provider_id', provider.id).in('status', ['authorized', 'paused', 'pending']).order('created_at', { ascending: false }).maybeSingle()
    if (!sub?.mp_preapproval_id) return json({ error: 'no_active_subscription' }, 404)
    const r = await fetch(`https://api.mercadopago.com/preapproval/${sub.mp_preapproval_id}`, { method: 'PUT', headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
    if (!r.ok) return json({ error: 'mp_error' }, 502)
    return json({ ok: true })  // el webhook reflejará el estado final
  } catch (_e) { return json({ error: 'bad_request' }, 400) }
})
```

- [ ] **Step 2: Deploy**

Run: `supabase functions deploy subscription-cancel`
Expected: deployado.

- [ ] **Step 3: Verificar 401 sin Authorization**

Run: `curl -s -o /dev/null -w '%{http_code}\n' -X POST "<FUNCTIONS_URL>/subscription-cancel" -H 'content-type: application/json' -d '{}'`
Expected: `401`.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/subscription-cancel/index.ts
git commit -m "feat(sub): edge function subscription-cancel (valida JWT del prestador)"
```

---

### Task 5: Frontend — flag + hook `useSubscription` + CTA en `/planes`

**Files:**
- Modify: `.env.example`, `.env.production.example` (agregar `VITE_SUBSCRIPTIONS_ENABLED=false`)
- Create: `src/features/subscriptions/hooks/useSubscription.ts`, `src/features/subscriptions/hooks/index.ts`
- Modify: `src/features/subscriptions/components/PricingPage.tsx`

**Interfaces:**
- Produces: `useSubscription()` → `{ enabled: boolean, subscribe(tierId): Promise<void>, status: {tier_id,status,current_period_end}|null, cancel(): Promise<void>, loading }`. `enabled = import.meta.env.VITE_SUBSCRIPTIONS_ENABLED === 'true'`.

- [ ] **Step 1: Hook `useSubscription`**

```ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type SubStatus = { tier_id: string; status: string; current_period_end: string | null }

export function useSubscription() {
  const enabled = import.meta.env.VITE_SUBSCRIPTIONS_ENABLED === 'true'
  const [status, setStatus] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc('get_my_subscription')
    setStatus((data?.[0] as SubStatus) ?? null)
  }, [])
  useEffect(() => { if (enabled) refresh() }, [enabled, refresh])

  const subscribe = useCallback(async (tierId: string, payerEmail?: string) => {
    setLoading(true)
    const { data, error } = await supabase.functions.invoke('subscription-checkout', { body: { providerId: await currentProviderId(), tierId, payerEmail } })
    setLoading(false)
    if (error || !data?.init_point) throw new Error('checkout_failed')
    window.location.href = data.init_point as string
  }, [])

  const cancel = useCallback(async () => {
    setLoading(true)
    const { error } = await supabase.functions.invoke('subscription-cancel', { body: {} })
    setLoading(false)
    if (error) throw new Error('cancel_failed')
    await refresh()
  }, [refresh])

  return { enabled, status, loading, subscribe, cancel, refresh }
}

async function currentProviderId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('providers').select('id').eq('auth_user_id', user.id).maybeSingle()
  return data?.id ?? null
}
```

Barrel `index.ts`: `export { useSubscription } from './useSubscription'`.

- [ ] **Step 2: CTA gobernada por el flag en `PricingPage`**

En cada card de plan, reemplazar el CTA actual por:
```tsx
const { enabled, subscribe } = useSubscription()
// ...
{enabled ? (
  <button onClick={() => subscribe(tier.id).catch(() => alert('No pudimos iniciar la suscripción. Probá de nuevo.'))}
    className="...primary..." style={{ backgroundColor: 'var(--color-bosque-lt)', color: '#fff' }}>
    Suscribirme
  </button>
) : (
  <div className="w-full py-3 rounded-full text-center font-bold text-sm" style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-dk)' }}>
    Gratis durante el lanzamiento 🎉
  </div>
)}
```

- [ ] **Step 3: env examples**

Agregar a `.env.example` y `.env.production.example`:
```
# Suscripciones de prestadores (MP preapproval). false = dormido (lanzamiento gratis).
VITE_SUBSCRIPTIONS_ENABLED=false
```

- [ ] **Step 4: tsc**

Run: `npx tsc --noEmit` → Expected: sin errores.

- [ ] **Step 5: Verificar dormido en runtime**

Local con `.env.local` SIN el flag (o `=false`): `npm run dev`, navegar `/planes` con Playwright → Expected: cada plan muestra "Gratis durante el lanzamiento 🎉", no "Suscribirme".

- [ ] **Step 6: Commit**

```bash
git add src/features/subscriptions .env.example .env.production.example
git commit -m "feat(sub): hook useSubscription + CTA de /planes gobernada por flag (dormido)"
```

---

### Task 6: Frontend — tarjeta "Tu suscripción" + cancelar en el dashboard

**Files:**
- Modify: `src/pages/ProviderDashboard.tsx` (dentro del branch de sesión real `DashboardMain`)

**Interfaces:**
- Consumes: `useSubscription()` (Task 5).

- [ ] **Step 1: Renderizar la tarjeta en `DashboardMain`** (solo si `enabled`)

```tsx
const { enabled, status, cancel, loading } = useSubscription()
// dentro del render del panel:
{enabled && (
  <section className="rounded-[--radius-xl] p-5 border" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
    <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-nieve)' }}>Tu suscripción</h3>
    {status && status.status === 'authorized' ? (
      <>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Plan <b style={{ color: 'var(--color-nieve)' }}>{status.tier_id}</b> · activa
          {status.current_period_end && ` · próximo cobro ${new Date(status.current_period_end).toLocaleDateString('es-AR')}`}
        </p>
        <button onClick={() => cancel().catch(() => alert('No pudimos cancelar. Probá de nuevo.'))} disabled={loading}
          className="mt-3 px-4 py-2 rounded-[--radius-lg] text-xs font-semibold border disabled:opacity-60" style={{ borderColor: 'var(--color-line)', color: 'var(--color-nieve)' }}>
          Cancelar suscripción
        </button>
      </>
    ) : (
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No tenés una suscripción activa. <a href="/planes" style={{ color: 'var(--color-bosque-lt)' }}>Ver planes</a></p>
    )}
  </section>
)}
```

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit` → Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProviderDashboard.tsx
git commit -m "feat(sub): tarjeta 'Tu suscripción' + cancelar en el dashboard (gated por flag)"
```

---

### Task 7: Verificación E2E (MP test mode)

**Files:** ninguno (verificación).

**Precondición:** `MP_ACCESS_TOKEN` = token de PRUEBA (ya está). La cuenta MP de test debe tener Suscripciones habilitado. Webhook URL de `subscription-webhook` configurada en el panel de MP de test (o se invoca manualmente con el preapproval_id para simular la notificación).

- [ ] **Step 1: Prender el flag local** — en `.env.local`: `VITE_SUBSCRIPTIONS_ENABLED=true`; `npm run dev`.

- [ ] **Step 2: Loguearse como un prestador de prueba** (crear uno con `auth_user_id` o usar uno existente con login real) y abrir `/planes`. Verificar: CTA "Suscribirme" visible.

- [ ] **Step 3: Suscribir** → click "Suscribirme" (Profesional) → redirect a MP → autorizar con tarjeta APRO (5031 7557 3453 0604, 11/30, 123, DNI 12345678).

- [ ] **Step 4: Disparar/esperar webhook** y verificar entitlement:

Run: `supabase db query --linked "select ps.status, ps.tier_id, p.subscription_tier_id from provider_subscriptions ps join providers p on p.id=ps.provider_id order by ps.created_at desc limit 1;"`
Expected: `status='authorized'`, `providers.subscription_tier_id='profesional'`.

- [ ] **Step 5: Dashboard** → `/dashboard` muestra "Tu suscripción · profesional · activa".

- [ ] **Step 6: Cancelar** → botón Cancelar → verificar:

Run: `supabase db query --linked "select ps.status, p.subscription_tier_id from provider_subscriptions ps join providers p on p.id=ps.provider_id order by ps.created_at desc limit 1;"`
Expected: `status='cancelled'`, `subscription_tier_id` = null.

- [ ] **Step 7: Seguridad** — anon contra `provider_subscriptions` → `401` (repetir el curl del Task 1 Step 3).

- [ ] **Step 8: Apagar el flag** — volver `.env.local` a `VITE_SUBSCRIPTIONS_ENABLED=false` (dormido para el lanzamiento). Limpiar filas de prueba en `provider_subscriptions` y resetear el `subscription_tier_id` del prestador de prueba a su valor previo.

- [ ] **Step 9: Commit final** (si hubo ajustes durante la verificación; si no, nada).

---

## Self-Review

- **Cobertura del spec:** §3 tabla+entitlement → Task 1. §4 checkout/webhook/cancel → Tasks 2/3/4. §5 flag+/planes+dashboard+hook → Tasks 5/6. §7 testing → Task 7. §2 preapproval mensual → Task 2 (auto_recurring). ✓
- **Placeholders:** `<FUNCTIONS_URL>` se resuelve como `$VITE_SUPABASE_URL/functions/v1` al ejecutar; la migración tiene timestamp real. Sin TODOs.
- **Consistencia de tipos:** `useSubscription()` expone `{enabled,status,loading,subscribe,cancel,refresh}` y se consume igual en Tasks 5 y 6. `get_my_subscription` devuelve `{tier_id,status,current_period_end}` ↔ `SubStatus`. ✓
- **Dependencia externa:** Task 7 requiere cuenta MP test con Suscripciones + webhook configurado; si no está, el happy-path se difiere (queda documentado), pero checkout/cancel/RLS se verifican igual.
