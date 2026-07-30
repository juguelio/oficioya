-- =============================================================================
-- `providers_public` pasa a ser el ÚNICO camino de lectura de anon.
--
-- POR QUÉ: la migración 20260730013415 agregó el enmascarado del whatsapp de los
-- prestadores en guardia en la vista, y su comentario afirmaba que el número "SOLO
-- se revela vía la edge function emergency-verify, post-pago". Eso era falso: la
-- TABLA BASE `providers` también es legible por anon —política `providers_select_active`
-- (`using (status = 'active')`, migración 20260403000000), sin restricción de columnas
-- y sin que ninguna migración revocara el grant. O sea:
--
--   GET /rest/v1/providers?is_emergency_available=eq.true&select=name,whatsapp_number
--
-- con la anon key (que va en el bundle) devolvía el WhatsApp de los prestadores en
-- guardia, salteando el cobro de $20.000 ARS. Hoy es latente porque no hay filas
-- `status='active'`, pero se activa con el primer prestador que reclame su perfil y
-- prenda el modo guardia — justo el escenario para el que se escribió la 013415.
--
-- Cierra también el vector de Realtime: `providers` está en la publicación
-- `supabase_realtime` (20260531000008) y los payloads de `postgres_changes` respetan
-- los privilegios del rol suscriptor, así que el UPDATE que prende el modo guardia
-- venía difundiendo la fila completa a cualquier suscriptor anon.
--
-- POR QUÉ ES SEGURO:
--   · `providers_public` NO tiene `security_invoker`, así que lee la tabla base con los
--     privilegios de su dueño (`postgres`), no del llamador. El revoke no la afecta.
--     Verificado: `pg_class.reloptions` es NULL para la vista.
--   · Todas las lecturas de la tabla base en el cliente están detrás de una sesión:
--     ProviderDashboard (`if (!user) return`), EmergencyPage (idem), useJobs,
--     useDashboardData, ProviderSignup (dentro de `if (authData.session)`),
--     ConversationalOnboarding. `authenticated` conserva el grant intacto.
--   · Las edge functions (emergency-verify, subscription-*, emergency-checkout) usan
--     service_role, que no se toca.
--   · `useGuardiaCount` era la única lectura sin sesión: se repunta a `providers_public`
--     en el mismo commit.
--
-- Nota de método: en Postgres un revoke a nivel columna NO anula un grant a nivel tabla,
-- así que hay que revocar la tabla y no volver a otorgarla. Si en el futuro anon
-- necesitara leer algo de `providers`, agregarlo a la vista — no re-otorgar la tabla.
-- =============================================================================

revoke select on providers from anon;

-- La política sigue existiendo para `authenticated`; ya no hay grant de anon que la use.
comment on table providers is
  'Tabla base. anon NO tiene SELECT: su único camino de lectura es la vista providers_public, que enmascara whatsapp_number salvo prestador active y NO en guardia. No re-otorgar SELECT a anon: expondría whatsapp_number/phone/claim_token/auth_user_id y saltearía el paywall de urgencias.';
