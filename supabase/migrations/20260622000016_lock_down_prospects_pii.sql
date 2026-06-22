-- Fix de seguridad: los prospectos (leads de outreach — nombre/teléfono/dirección de
-- prestadores) son datos INTERNOS, NO del marketplace. La migración 015 dejó expuesto:
--   1) vista prospects_priorizados: security_invoker no seteado (bypassa RLS) + grant a
--      anon → cualquiera con la anon key (pública, va en el bundle) dumpea todos los tel.
--   2) ingest_prospects(): grant execute a anon → spam/inyección de prospectos.
-- Sólo n8n (service_role) debe escribir/leer prospectos.

-- 1) Vista: que respete RLS y fuera del alcance de anon/authenticated.
alter view prospects_priorizados set (security_invoker = true);
revoke all on prospects_priorizados from anon, authenticated;

-- 2) Tabla prospects: interna, fuera del Data API público.
revoke all on prospects from anon, authenticated;

-- 3) ingest_prospects: sólo el rol que usa n8n.
revoke execute on function ingest_prospects(jsonb) from public, anon, authenticated;
grant execute on function ingest_prospects(jsonb) to service_role;
