# Perfiles pre-armados reclamables ("ya tenés tu perfil, sólo confirmá")

**Decisión del fundador (2026-06-24):** los perfiles pre-armados se muestran **PÚBLICOS**
(la web parece poblada del día 1), pero el **contacto (WhatsApp) queda OCULTO** hasta que el
prestador **confirma su membresía** (claim, de un toque). Liquidez aparente + imán de demanda,
sin compartir el contacto de nadie sin consentimiento.

El heavy onboarding lo hacemos nosotros: armamos el perfil con la data del crawl. El prestador
sólo confirma. Los **multi-fuente (source_count ≥ 2)** van arriba en la cola de contacto y en el
listado (de esos estamos más seguros).

---

## Estado de la implementación

- [x] **DB** — `supabase/migrations/20260622000018_claimable_profiles.sql` (escrita, **sin aplicar**)
  - estado `unclaimed` en `providers`
  - campos: `claim_token`, `claimed_at`, `external_rating`, `external_reviews`, `source_count`
  - `build_claimable_profiles()` → puebla `providers` (unclaimed) desde `prospects` válidos (service_role)
  - vista `providers_public` → active + unclaimed, **whatsapp enmascarado** salvo active
  - `get_claimable_by_token(uuid)` → lee el perfil para la página de claim
  - `claim_provider(uuid, text)` → activa de un toque + captura consentimiento
- [ ] **Frontend** (Code) — ver abajo
- [ ] **Aplicar + TEST PII con anon key** (Code) — gate obligatorio
- [ ] **WhatsApp outbound** linkeando a `/activar/:id#t=token` (follow-up)

---

## Frontend (para Code)

### 1. Read path → `providers_public`
`useProviders` (`src/features/providers/hooks/useProviders.ts`) hoy hace
`from('providers').select('*').eq('status','active')`. Cambiar a `from('providers_public').select('*')`
(la vista ya filtra a active + unclaimed). Mapear los campos nuevos en `toProvider()`:
`claimed` (bool), `external_rating`, `external_reviews`, `source_count`.

**Orden del listado** (ajustar el sort actual):
```
1. 🔴 en guardia (isEmergencyAvailable)
2. ✓ reclamados (claimed=true): destacado → profesional → basico → sin plan, rating desc
3. ⏳ sin reclamar (claimed=false): source_count desc, luego external_rating desc
```
Los reclamados (miembros reales) SIEMPRE por encima de los sin reclamar.

### 2. `ProviderProfile` (perfil público)
- Si `claimed === false`:
  - **Ocultar el CTA de WhatsApp.** En su lugar: estado claro tipo
    "Este profesional todavía no activó su perfil en Oficio."
  - Badge sutil "Sin confirmar" (NO usar el verde de verificado).
  - Si hay `external_rating`: mostrarlo **etiquetado como externo** →
    "★ {external_rating} en Google ({external_reviews} reseñas)". NUNCA mostrarlo como rating de Oficio.
  - El `rating` de Oficio de un unclaimed es 0 → no mostrar estrellas de Oficio.
- Si `claimed === true`: comportamiento actual (WhatsApp visible, etc.).

### 3. Página de claim — ruta nueva `/activar/:id`
- Token en el **fragment** (`#t=...`), igual que `JobDetailPage` (no en query → no viaja a logs/PostHog).
- Lee con `supabase.rpc('get_claimable_by_token', { p_token })`.
  - Si `null` → "Link inválido o vencido".
  - Si `already_claimed` → "Este perfil ya está activo" + link al perfil.
- Muestra el perfil pre-armado (nombre, rubro, ciudad, señal externa) con copy:
  "Te armamos tu perfil en Oficio. Confirmá que sos vos y empezá a recibir contactos — gratis."
- Un toque: botón "Sí, soy yo — activar mi perfil". Opcional: input para confirmar/editar el WhatsApp
  (pre-cargado con el del crawl, oculto detrás de "¿Otro número?").
- Al confirmar → `supabase.rpc('claim_provider', { p_token, p_whatsapp })`.
  - `ok:true` → pantalla de éxito + link al perfil ya activo + sugerir verificación (DNI/matrícula) y planes.
- Mobile-first, dark, voseo, patrones de CLAUDE.md (header fijo, botones `active:scale-95`).
- Registrar la ruta en `Router.tsx` (lazy).

### 4. `database.types.ts`
Agregar la vista `providers_public` y las funciones `get_claimable_by_token`,
`claim_provider`, `build_claimable_profiles`.

---

## ⚠️ Gate obligatorio antes de cerrar (TEST PII con ANON key)
Mismo error que el leak de la 015 — verificar con la **anon key** (no service role):
```sql
-- Debe devolver NULL en whatsapp_number para TODOS los unclaimed:
select status, whatsapp_number from providers_public where status='unclaimed' limit 10;
-- Debe dar permission denied (la tabla cruda no es legible por anon para unclaimed):
select * from providers where status='unclaimed' limit 1;
```
Si algún unclaimed devuelve un WhatsApp → NO mergear.

## Después de aplicar
```sql
select build_claimable_profiles();   -- puebla los perfiles; devuelve cuántos creó
```
Verificar que aparecen en el listado público (sin contacto) y que el claim los pasa a active.
