-- =============================================================================
-- Oficio — aplicar Junín + relajar filtro de captación — 2026-07-29
--
-- Pegar TODO en el SQL Editor de Supabase (proyecto dmzdvjfctkfxefhxjmkm) y correr.
-- Equivale a las migraciones 20260729000022 y 20260729000023 + el build + readback.
-- Es idempotente: se puede correr dos veces sin duplicar nada.
-- =============================================================================

-- ── 1) Alta de Junín de los Andes en cities ──────────────────────────────────
-- Sin esta fila, build_claimable_profiles() descarta en silencio todo prospect
-- con ciudad='junin' (hace `join cities`), y providers.ciudad_id no puede
-- referenciarla (FK).
insert into cities (id, label, phone_prefix, lat, lng) values
  ('junin', 'Junín de los Andes', '+5492972', -39.9497, -71.0678)
on conflict (id) do nothing;


-- ── 2) Relajar el filtro de teléfono ─────────────────────────────────────────
-- El `like '+549%'` descartaba 48 de 52 prospects de poraca y 40 de 58 de Junín,
-- incluidos el único cerrajero y el único calefaccionista de la localidad.
-- Un E.164 de 12 dígitos (+54 2972 XXXXXX) NO implica línea fija: Google y los
-- directorios normalizan inconsistentemente y muchos móviles quedan sin el 9.
--
-- Guardar un fijo en whatsapp_number es seguro: providers_public lo enmascara
-- mientras esté 'unclaimed', y claim_provider() lo sobrescribe con el número que
-- confirma el prestador al reclamar.
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
    -- Para acotar al radio operativo (262 en vez de 300), descomentar:
    -- and p.ciudad in ('san-martin', 'junin')
    and not exists (
      select 1 from providers pr
      where right(regexp_replace(pr.whatsapp_number, '\D', '', 'g'), 10)
          = right(regexp_replace(p.phone, '\D', '', 'g'), 10)
    )
  order by right(regexp_replace(p.phone, '\D', '', 'g'), 10),
           (p.phone like '+549%') desc,          -- ante duplicado, preferir la forma móvil
           p.reviews_externo desc nulls last;
  get diagnostics n = row_count;
  return n;
end; $$;

revoke all on function build_claimable_profiles() from public;
grant execute on function build_claimable_profiles() to service_role;


-- ── 3) Construir los perfiles reclamables ────────────────────────────────────
-- Esperado: 300 (o 262 si descomentaste el filtro de radio).
select build_claimable_profiles() as filas_creadas;


-- ── 4) Readback, sin PII ─────────────────────────────────────────────────────
select ciudad_id, count(*) as unclaimed
from providers where status = 'unclaimed'
group by ciudad_id order by unclaimed desc;

select rubro_id, count(*) as n
from providers where status = 'unclaimed' and ciudad_id = 'junin'
group by rubro_id order by n desc;

-- Cuántos quedaron con teléfono en formato móvil vs. a confirmar por llamada
select ciudad_id,
       count(*) filter (where whatsapp_number like '+549%') as movil_probable,
       count(*) filter (where whatsapp_number not like '+549%') as llamar_primero
from providers where status = 'unclaimed'
group by ciudad_id order by ciudad_id;
