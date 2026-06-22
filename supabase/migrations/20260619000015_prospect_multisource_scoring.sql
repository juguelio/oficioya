-- =============================================================================
-- Multi-source scoring de prospectos.
-- Idea (del fundador): un prospecto que aparece en VARIAS fuentes es señal de un
-- prestador real/activo/establecido → más prioridad de contacto. Los "duplicados"
-- dejan de descartarse: se FUSIONAN y se cuenta en cuántas fuentes apareció.
-- El match es por teléfono NORMALIZADO (últimos 10 dígitos), así el fijo de una
-- fuente y el celular de otra (mismo número de abonado) se unifican.
-- =============================================================================

-- 1) Columnas nuevas
alter table prospects add column if not exists sources   text[] not null default '{}';
alter table prospects add column if not exists phone_key text;

-- 2) Backfill
update prospects set phone_key = right(regexp_replace(phone, '\D', '', 'g'), 10) where phone_key is null;
update prospects set sources = array[source] where sources = '{}' and source is not null;

-- 3) Consolidar duplicados existentes por phone_key (quedarse con la mejor ficha,
--    unir las fuentes, borrar el resto).
with src as (
  select phone_key, array(select distinct unnest(array_agg(source))) as all_sources
  from prospects where phone_key is not null group by phone_key
),
keep as (
  select distinct on (phone_key) id, phone_key
  from prospects where phone_key is not null
  order by phone_key,
           (rating_externo is not null) desc,
           reviews_externo desc nulls last,
           length(coalesce(name, '')) desc
)
update prospects p set sources = s.all_sources
from src s
where p.phone_key = s.phone_key and p.id in (select id from keep);

-- El CTE vive sólo en el statement al que está pegado: el delete necesita su propio
-- `keep` (mismo criterio que el update de arriba) o `keep` queda fuera de scope.
with keep as (
  select distinct on (phone_key) id, phone_key
  from prospects where phone_key is not null
  order by phone_key,
           (rating_externo is not null) desc,
           reviews_externo desc nulls last,
           length(coalesce(name, '')) desc
)
delete from prospects p
where p.phone_key is not null
  and p.id not in (select id from keep);

-- 4) Índice único por teléfono normalizado (reemplaza el unique por string exacto)
drop index if exists prospects_phone_uniq;
create unique index if not exists prospects_phonekey_uniq on prospects (phone_key);

-- 5) RPC de ingesta con fusión multi-fuente. Lo llaman los workflows de n8n.
create or replace function ingest_prospects(p_rows jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  k text;
  n integer := 0;
begin
  for r in select * from jsonb_array_elements(p_rows) loop
    k := right(regexp_replace(coalesce(r->>'phone', ''), '\D', '', 'g'), 10);
    if length(k) < 8 then continue; end if;

    insert into prospects (name, phone, phone_key, rubro, ciudad, source, sources,
                           rating_externo, reviews_externo, address, notas)
    values (
      r->>'name', r->>'phone', k, r->>'rubro', r->>'ciudad', r->>'source', array[r->>'source'],
      nullif(r->>'rating_externo','')::numeric, nullif(r->>'reviews_externo','')::int,
      r->>'address', r->>'notas'
    )
    on conflict (phone_key) do update set
      sources         = (select array(select distinct unnest(prospects.sources || excluded.sources))),
      rating_externo  = greatest(coalesce(prospects.rating_externo, 0), coalesce(excluded.rating_externo, 0)),
      reviews_externo = greatest(coalesce(prospects.reviews_externo, 0), coalesce(excluded.reviews_externo, 0)),
      name            = coalesce(nullif(prospects.name, ''), excluded.name),
      address         = coalesce(prospects.address, excluded.address),
      updated_at      = now();
    n := n + 1;
  end loop;
  return n;
end;
$$;

grant execute on function ingest_prospects(jsonb) to anon, authenticated;

-- Cola de contacto priorizada (más fuentes = más arriba). Útil para el outreach.
create or replace view prospects_priorizados as
select *,
       cardinality(sources) as source_count
from prospects
order by cardinality(sources) desc,
         coalesce(rating_externo, 0) desc,
         coalesce(reviews_externo, 0) desc;

grant select on prospects_priorizados to anon, authenticated;
