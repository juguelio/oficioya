-- =============================================================================
-- claim_provider seguía siendo llamable sin sesión.
--
-- POR QUÉ: la migración anterior hacía `revoke ... from anon, authenticated`, pero
-- Postgres otorga EXECUTE a PUBLIC por defecto en TODA función. Revocarle a los
-- roles nominados no toca ese grant implícito, así que la RPC seguía expuesta en
-- /rest/v1/rpc/claim_provider — el mismo agujero que se pretendía cerrar: activar
-- un perfil ajeno (status → 'active', whatsapp sobrescrito) sin crear cuenta.
--
-- Detectado con el linter de Supabase (0028_anon_security_definer_function_executable)
-- y confirmado en pg_proc.proacl, donde figuraba la entrada '=X/postgres' (= PUBLIC).
--
-- REGLA GENERAL: para cerrar una función siempre hay que revocar de `public`.
-- Comprobación:
--   select proname, proacl from pg_proc where proname = 'claim_provider';
--   → NO debe aparecer ninguna entrada que empiece con '=' .
-- =============================================================================

revoke execute on function claim_provider(uuid, text) from public;
