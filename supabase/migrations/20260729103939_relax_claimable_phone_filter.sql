-- =============================================================================
-- Relaja el filtro de teléfono de build_claimable_profiles().
--
-- POR QUÉ: `where p.phone like '+549%'` era el cuello real de la captación, no la
-- falta de fuentes. Medido contra la DB el 2026-07-29:
--   · poraca:  48 de 52 prospects descartados
--   · Junín:   40 de 58 descartados (se perdían el único cerrajero y el único
--              calefaccionista de la localidad)
--
-- El supuesto de fondo era falso: un E.164 argentino de 12 dígitos (`+54 2972 XXXXXX`)
-- NO implica línea fija. Google Places y los directorios normalizan de forma
-- inconsistente y muchos móviles quedan sin el 9. Descartarlos perdía oferta real.
--
-- POR QUÉ ES SEGURO GUARDAR UN FIJO EN whatsapp_number:
--   1. `providers_public` enmascara whatsapp salvo status='active' (migración 018),
--      así que un unclaimed nunca expone el número.
--   2. `claim_provider(token, whatsapp)` lo sobrescribe con el que confirma el
--      prestador al reclamar el perfil.
--   3. whatsapp_number es NOT NULL, así que no hay opción de dejarlo vacío.
-- El outreach distingue el caso en query time: si empieza con '+549' es móvil
-- probable; si no, hay que llamar antes de mandar WhatsApp.
--
-- DEDUPE: se mantiene la comparación por los últimos 10 dígitos, que ya colapsa
-- las dos formas del mismo número (`+542972491859` y `+5492972491859` → 2972491859).
-- Se agrega `distinct on` para cubrir el caso nuevo: que ambas formas estén
-- cargadas como prospects distintos (el índice único de prospects es sobre el
-- teléfono crudo, así que pueden convivir). Cuando hay empate se prefiere la
-- forma móvil, y después la de más reviews.
-- =============================================================================

create or replace function build_claimable_profiles()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer := 0;
begin
  insert into providers (name, phone, whatsapp_number, ciudad_id, rubro_id, status,
                         is_verified, claim_token, external_rating, external_reviews, source_count, photos)
  select distinct on (right(regexp_replace(p.phone, '\D', '', 'g'), 10))
         p.name, p.phone, p.phone, p.ciudad, p.rubro, 'unclaimed', false,
         gen_random_uuid(), p.rating_externo, p.reviews_externo, cardinality(p.sources), '{}'
  from prospects p
  join rubros r on r.id = p.rubro
  join cities c on c.id = p.ciudad
  where p.phone like '+54%'
    and not exists (
      select 1 from providers pr
      where right(regexp_replace(pr.whatsapp_number, '\D', '', 'g'), 10)
          = right(regexp_replace(p.phone, '\D', '', 'g'), 10)
    )
  order by right(regexp_replace(p.phone, '\D', '', 'g'), 10),
           (p.phone like '+549%') desc,
           p.reviews_externo desc nulls last;
  get diagnostics n = row_count;
  return n;
end; $$;

revoke all on function build_claimable_profiles() from public;
grant execute on function build_claimable_profiles() to service_role;
