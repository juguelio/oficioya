-- =============================================================================
-- Oficio — pulido pre-campaña de adquisición por WhatsApp — 2026-07-29
--
-- Pegar TODO en el SQL Editor de Supabase (proyecto dmzdvjfctkfxefhxjmkm) y correr.
-- Idempotente: se puede correr dos veces sin efectos raros.
--
-- Hace 4 cosas:
--   1. Despublica los 40 perfiles seed fabricados
--   2. Despublica 52 perfiles mal clasificados (comercios, automotrices, otra ciudad)
--   3. Cierra build_claimable_profiles() a anon/authenticated
--   4. Aplica la migración 021 pendiente (paywall de guardia + RPC de reseñas)
-- =============================================================================


-- ── 1) Despublicar el seed fabricado ─────────────────────────────────────────
-- Los 40 'active' actuales son seed de demo: subscription_tier_id null,
-- external_rating null, created_at backdateado 2022-2025, uno por rubro por ciudad,
-- 31 con is_verified=true. Son personas inventadas con teléfonos de formato real.
-- No se borran: 'inactive' los saca de providers_public y es reversible.
update providers set status = 'inactive', updated_at = now()
where status = 'active'
  and external_rating is null
  and subscription_tier_id is null
  and claimed_at is null;


-- ── 2) Despublicar perfiles mal clasificados ─────────────────────────────────
-- Google Places devuelve quien VENDE el material, no quien HACE el trabajo.
-- Publicar un corralón como albañil, o un taller de chapa y pintura como pintor,
-- quema el contacto en un pueblo chico. Se despublican, no se borran: sirven como
-- hubs de referidos (un corralón sabe quién es cada albañil del pueblo).
update providers set status = 'inactive', updated_at = now()
where status = 'unclaimed'
  and (
       -- comercios / proveedores de materiales
       -- OJO: NO incluir 'eléctricos' ni 'sanitarios' a secas — matan a "ENERGEMA Servicios
       -- Eléctricos" y a un eventual "Instalaciones Sanitarias", que son prestadores reales.
       -- Los comercios ya quedan cubiertos por 'materiales' e 'iluminación'.
       name ~* '(corral[óo]n|ferreter[íi]a|maderer[ao]|aserradero|materiales|distribuidor|distrikol|pinturer[íi]a|buloner[íi]a|barraca|hormigoner|store|almac[ée]n de|galer[íi]a|art[íi]stica|iluminaci[óo]n|electroandes|estudioled|electrolum|electro ciudad|suc\.)'
       -- rubro equivocado: automotriz (electricidad del automotor, chapa y pintura)
    or name ~* '(automotor|autom[óo]vil|automotriz|chapa y pintura|electro auto|inyelab|gomer[íi]a|lubricentro|repuestos|gps taller|electromec)'
       -- ruido geográfico: negocios de Neuquén Capital etiquetados como san-martin
    or (ciudad_id = 'san-martin' and name ~* 'neuqu[ée]n')
  );


-- ── 3) Cerrar funciones que anon no debería poder ejecutar ───────────────────
-- `revoke from public` NO revoca un grant hecho directo a anon; hay que nombrarlos.
-- build_claimable_profiles es un primitivo de escritura sin autenticar.
-- Las otras tres son funciones de trigger: fuera de contexto fallan, pero no hay
-- razón para exponerlas en /rest/v1/rpc/.
revoke execute on function build_claimable_profiles()          from anon, authenticated;
revoke execute on function handle_new_provider()               from anon, authenticated;
revoke execute on function link_prospect_on_provider_insert()  from anon, authenticated;
revoke execute on function rls_auto_enable()                   from anon, authenticated;


-- ── 4) Migración 021 pendiente desde el 2026-07-02 ───────────────────────────
-- 4a. providers_public: enmascarar el whatsapp de prestadores en guardia.
--     Hoy el paywall de urgencias se enforcea SOLO en la UI: el número viene igual
--     en la respuesta de la vista. Latente (0 en guardia hoy), pero el día que el
--     primer prestador active modo guardia, su WhatsApp queda legible con la anon key.
create or replace view providers_public as
select id, name, rubro_id, ciudad_id, barrio, bio,
       rating, total_jobs, is_verified, subscription_tier_id, is_emergency_available, status,
       (status = 'active')                                          as claimed,
       external_rating, external_reviews, source_count,
       photos, lat, lng, created_at,
       case
         when status = 'active' and not is_emergency_available then whatsapp_number
         else null
       end as whatsapp_number
from providers
where status in ('active', 'unclaimed');

-- 4b. submit_review: hoy useReviews.ts:68 llama este RPC y no existe → las reseñas
--     están rotas en producción.
create or replace function submit_review(
  p_provider_id uuid,
  p_author_name text,
  p_rating      integer,
  p_comment     text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_review reviews;
begin
  if p_rating not between 1 and 5 then
    raise exception 'rating fuera de rango';
  end if;
  if length(trim(p_author_name)) < 2 or length(trim(p_author_name)) > 60 then
    raise exception 'nombre inválido';
  end if;
  if length(trim(p_comment)) < 10 or length(trim(p_comment)) > 600 then
    raise exception 'comentario inválido';
  end if;
  if not exists (select 1 from providers where id = p_provider_id and status = 'active') then
    raise exception 'prestador inexistente o inactivo';
  end if;
  if (select count(*) from reviews
       where provider_id = p_provider_id
         and created_at > now() - interval '1 day') >= 3 then
    raise exception 'límite de reseñas alcanzado, probá mañana';
  end if;

  insert into reviews (provider_id, author_name, rating, comment)
  values (p_provider_id, trim(p_author_name), p_rating, trim(p_comment))
  returning * into v_review;

  return row_to_json(v_review);
end;
$$;

grant execute on function submit_review(uuid,text,integer,text) to anon, authenticated;


-- ── 5) Readback ──────────────────────────────────────────────────────────────
select status, count(*) as n from providers group by status order by n desc;

select ciudad_id, count(*) as publicados
from providers where status = 'unclaimed'
group by ciudad_id order by publicados desc;

select rubro_id, count(*) as n
from providers where status='unclaimed' and ciudad_id in ('san-martin','junin')
group by rubro_id order by n desc;

-- Debe dar false en las cuatro
select p.proname, has_function_privilege('anon', p.oid, 'EXECUTE') as anon_puede
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('build_claimable_profiles','handle_new_provider',
                    'link_prospect_on_provider_insert','rls_auto_enable');

-- Debe existir
select count(*) as submit_review_existe
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='submit_review';
