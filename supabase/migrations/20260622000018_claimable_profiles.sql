-- =============================================================================
-- Perfiles pre-armados reclamables ("ya tenés tu perfil, sólo confirmá").
-- Decisión del fundador: los perfiles se muestran PÚBLICOS (la web parece poblada),
-- pero el CONTACTO (whatsapp_number) queda OCULTO hasta que el prestador CONFIRMA su
-- membresía (claim). Liquidez aparente sin compartir el contacto de nadie sin consentimiento.
--
-- ⚠️ GUARDRAIL PII (NO repetir el leak de la 015): el whatsapp de un perfil 'unclaimed'
--    NUNCA debe ser legible por anon. Se enmascara en la vista pública. Hay un test
--    obligatorio al final (en comentario) que DEBE correrse con la anon key antes de dar
--    esto por cerrado.
-- =============================================================================

-- 1) Nuevo estado 'unclaimed'
alter table providers drop constraint if exists providers_status_check;
alter table providers add constraint providers_status_check
  check (status in ('active', 'inactive', 'pending', 'unclaimed'));

-- 2) Campos del perfil reclamable
alter table providers add column if not exists claim_token      uuid;
alter table providers add column if not exists claimed_at       timestamptz;
alter table providers add column if not exists external_rating  numeric(3,1);  -- rating de Google/directorio (señal externa, NO el rating de Oficio)
alter table providers add column if not exists external_reviews integer;
alter table providers add column if not exists source_count     integer not null default 1;

create index if not exists providers_claim_token_idx on providers (claim_token) where claim_token is not null;
create index if not exists providers_unclaimed_idx on providers (ciudad_id, rubro_id) where status = 'unclaimed';

-- 3) Poblar providers 'unclaimed' desde prospects válidos (sólo rubros/ciudades válidos,
--    móviles, que NO existan ya como provider — match por teléfono normalizado). Service role.
create or replace function build_claimable_profiles()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer := 0;
begin
  insert into providers (name, phone, whatsapp_number, ciudad_id, rubro_id, status,
                         is_verified, claim_token, external_rating, external_reviews, source_count, photos)
  select p.name, p.phone, p.phone, p.ciudad, p.rubro, 'unclaimed', false,
         gen_random_uuid(), p.rating_externo, p.reviews_externo, cardinality(p.sources), '{}'
  from prospects p
  join rubros r on r.id = p.rubro
  join cities c on c.id = p.ciudad
  where p.phone like '+549%'
    and not exists (
      select 1 from providers pr
      where right(regexp_replace(pr.whatsapp_number, '\D', '', 'g'), 10)
          = right(regexp_replace(p.phone, '\D', '', 'g'), 10)
    );
  get diagnostics n = row_count;
  return n;
end; $$;
revoke all on function build_claimable_profiles() from public;
grant execute on function build_claimable_profiles() to service_role;

-- 4) Vista pública: active + unclaimed. whatsapp OCULTO salvo que esté 'active'.
create or replace view providers_public as
select id, name, rubro_id, ciudad_id, barrio, bio,
       rating, total_jobs, is_verified, subscription_tier_id, is_emergency_available, status,
       (status = 'active')                                          as claimed,
       external_rating, external_reviews, source_count,
       photos, lat, lng, created_at,
       case when status = 'active' then whatsapp_number else null end as whatsapp_number
from providers
where status in ('active', 'unclaimed');

revoke all on providers_public from anon, authenticated;
grant select on providers_public to anon, authenticated;

-- 5) Leer un perfil reclamable por token (para la página de claim — devuelve SU whatsapp
--    porque el token sólo lo tiene el dueño, que lo recibió por WhatsApp).
create or replace function get_claimable_by_token(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare pr providers;
begin
  select * into pr from providers where claim_token = p_token;
  if not found then return null; end if;
  return json_build_object(
    'id', pr.id, 'name', pr.name, 'rubro_id', pr.rubro_id, 'ciudad_id', pr.ciudad_id,
    'whatsapp_number', pr.whatsapp_number, 'external_rating', pr.external_rating,
    'external_reviews', pr.external_reviews, 'status', pr.status,
    'already_claimed', (pr.status = 'active')
  );
end; $$;
grant execute on function get_claimable_by_token(uuid) to anon, authenticated;

-- 6) Reclamar (un toque). Token unguessable (uuid) → sólo el dueño lo tiene. Activa el perfil
--    y captura el whatsapp confirmado + consentimiento (claimed_at).
create or replace function claim_provider(p_token uuid, p_whatsapp text)
returns json language plpgsql security definer set search_path = public as $$
declare pr providers;
begin
  select * into pr from providers where claim_token = p_token and status = 'unclaimed';
  if not found then return json_build_object('ok', false, 'error', 'not_found_or_already_claimed'); end if;
  update providers set
    status          = 'active',
    whatsapp_number = coalesce(nullif(trim(p_whatsapp), ''), pr.whatsapp_number),
    claimed_at      = now(),
    updated_at      = now()
  where id = pr.id;
  return json_build_object('ok', true, 'id', pr.id, 'name', pr.name);
end; $$;
grant execute on function claim_provider(uuid, text) to anon, authenticated;

-- =============================================================================
-- TEST OBLIGATORIO (correr con la ANON key, NO service role):
--   select whatsapp_number from providers_public where status = 'unclaimed' limit 5;
--   → DEBE devolver NULL en whatsapp_number para TODOS. Si devuelve un número, HAY LEAK.
--   select * from providers where status='unclaimed' limit 1;  -- con anon → debe dar permission denied
-- =============================================================================
