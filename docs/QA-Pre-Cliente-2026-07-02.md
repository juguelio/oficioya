# QA Pre-Cliente — 2026-07-02

Auditoría completa pre-reunión. `npx tsc --noEmit` pasa limpio antes y después de los fixes.
Contexto: [[GO-LIVE-SMA]], [[PROJECTS]], CLAUDE.md §12/§18.

---

## ✅ Arreglado hoy (4 fixes, mergeables ya)

### 1. 🔴 Paywall de guardia bypasseado (crítico — revenue leak)
El WhatsApp de un prestador en modo guardia se revelaba directo (link `wa.me` + teléfono en texto plano) en `ProviderProfile` y en la card de `RubroPage`, salteando el paywall de $20.000 (§8). Como los de guardia ordenan **primeros** en todos los listados, era el camino más probable.
**Fix:** si `isEmergencyAvailable`, el CTA pasa a "En guardia — Contactar urgencia" (rojo `--color-emergency`) → `/emergencias/contratar/:id`. El teléfono queda oculto. Evento nuevo: `emergency_contact_click` (sources: `profile`, `rubro_list`).
**Pendiente de fondo:** el `whatsapp_number` de los de guardia sigue viniendo en la respuesta de `providers_public` — el enmascarado server-side (como el de unclaimed) sería el cierre definitivo. Va en una migración, no lo toqué hoy.

### 2. ★ 0.0 en casi toda la web (crítico para la demo)
`RubroPage` (badge de card) y `HomePage` (MiniCard) mostraban `rating.toFixed(1)` incondicional → los 99 perfiles sin reclamar (la mayoría del contenido día 1) mostraban "★ 0.0". `ProviderProfile` ya tenía la lógica correcta; ahora las tres superficies son consistentes: rating Oficio si `claimed && rating > 0`, si no `externalRating` etiquetado "Google", si no nada.

### 3. Input invisible en el flujo de claim
`ClaimProfilePage` (el flujo `/activar/:id` que van a tocar los 99 del outreach): el input "¿Otro número?" tenía fondo `#090f14` (resto de Stitch) con texto `--color-nieve` (#1A1714) → **texto casi invisible sobre fondo oscuro**. Migrado al estilo estándar de inputs (§15).

### 4. Colores de rating migrados a `var(--color-amber)` en los puntos tocados.

---

## ⚠️ Pendientes priorizados (no tocados hoy — decisiones o riesgo)

1. **Reseñas no son de Supabase.** `ProviderProfile` lee/escribe reseñas del store Zustand del dashboard (persist en `localStorage`, seed `mockReviews`). Una reseña enviada solo existe en ese navegador. La migración `..011_reviews_and_certifications` ya existe — falta el hook (`useReviews`) contra la tabla real. Es el gap más grande entre lo documentado y lo real.
2. **Fallback a mock en `/prestador/:id`.** Si el id no está en Supabase cae a `mockProviders` → `/prestador/p1` muestra una persona inventada en prod. Sacar el fallback o devolver "no encontrado".
3. **Precios duplicados ×3.** `PricingPage`, `ConversationalOnboarding` y `ProviderSignup` definen cada uno sus planes con `priceARS` hardcodeado, y `HomePage` tiene "$20.000/mes" en el copy. Un ajuste por inflación hoy requiere tocar 4 archivos → mover a una fuente única (`shared/` o `tokens.ts`).
4. **Imports cross-feature** (providers→dashboard, search→providers, jobs→search) violan la regla §3. Funciona, pero o se documentan como excepciones o lo compartido se mueve a `shared/`.
5. **`ProviderCard` (el de `features/providers/components/ProviderCard/`) está muerto** — nadie lo importa, y también revela WhatsApp sin chequear guardia. Borrarlo o alinearlo antes de que alguien lo reuse.
6. **Acentos fuera de paleta:** `#F5C842`, `#4A8C49`, `#2E6E8A` en ConversationalOnboarding/PricingPage; overlays `rgba(14,21,16,…)` (verde Stitch) en badges sobre fotos. Cosmético.

---

## Para la reunión

- **Happy path demo:** Home → San Martín → rubro → perfil → WhatsApp ✓ (verificado en código; smoke test §1.4 del [[GO-LIVE-SMA]] sigue vigente en el celu).
- **No demostrar** el checkout de urgencias end-to-end con plata real: MP sigue en TEST en prod (blocker conocido).
- Si preguntan por reseñas: mostrar el flujo funciona, pero aclarar internamente que la persistencia real es el pendiente #1.

*Escrito por Claude durante QA del 2026-07-02.*

---

## Update (misma sesión): pendientes #1 y #2 resueltos

Reseñas reales (`useReviews` + RPC `submit_review`), fallback mock eliminado, y whatsapp de guardia enmascarado server-side — todo en la migración `20260702000021_guardia_pii_and_review_rpc.sql`. ⚠️ **Correr `supabase db push` antes del próximo deploy.** Quedan #3–#6.

---

## Update (2026-07-15): pendientes #3–#6 resueltos

`npx tsc --noEmit` pasa limpio. Sin cambios de precio, diseño ni al flujo de guardia; migración 021 intacta; no se corrió `supabase db push`.

- **#3 — Precios a fuente única.** Nueva fuente única `src/shared/config/plans.ts` (`SubscriptionPlan`, `SUBSCRIPTION_PLANS`, `BASE_PLAN`). El tipo `SubscriptionPlan` se movió ahí y `features/subscriptions/types.ts` lo re-exporta (compat). Consumen de la fuente: `PricingPage`, `ConversationalOnboarding` y `ProviderSignup` (precio+label de la fuente; contactos/features/acento quedan como presentación local). El copy de HomePage ("$20.000/mes") ahora deriva de `BASE_PLAN.priceARS` vía `formatARS()`. Un ajuste por inflación es 1 archivo.
- **#4 — Imports cross-feature.** `toProvider` movido a `src/shared/utils/toProvider.ts`; el tipo `Provider` en `search` ahora se importa de `@/shared/types`. `providers→dashboard` confirmado inexistente. **Excepciones documentadas (no movidas, serían refactor grande), con comentario `// excepción documentada:` en el sitio de import:** (a) `search → providers` vía el hook `useProviders` (`HomePage`, `RubroPage`) — encapsula el fetch a `providers_public`; (b) `jobs → search` vía `useCityStore` (`JobsPage`, `PostJobPage`) — store Zustand con persist cuyo dueño natural es `search`.
- **#5 — ProviderCard muerto.** Sin usos (solo se referenciaba a sí mismo + barrel). Borrada la carpeta `features/providers/components/ProviderCard/` y el barrel `components/index.ts` (única export, sin consumidores).
- **#6 — Acentos fuera de paleta → var CSS (§10).** En `ConversationalOnboarding.tsx` y `PricingPage.tsx`: `#F5C842`→`var(--color-amber)`, `#2E6E8A`→`var(--color-bosque-lt)`, `#4A8C49`→`var(--color-guardia)`, `#E8A020`→`var(--color-amber)`. Intactos: `#25D366` (WhatsApp), `#ffb4ab` (error), mapa de `EmergencyMap.tsx`, paleta de `Avatar.tsx`. **Nota de scope:** `ProviderSignup.tsx` conserva los mismos hex de acento — quedó fuera del scope de #6 (que nombra solo esos dos archivos); pendiente si se quiere consistencia total.
