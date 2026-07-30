-- =============================================================================
-- 1) providers_public: enmascarar whatsapp_number de prestadores en guardia.
--    El paywall de urgencias (§8/§12) se enforcea en UI, pero el número seguía
--    viniendo en la respuesta de la vista → cualquiera podía leerlo del network
--    tab. Ahora el WhatsApp de un prestador en guardia SOLO se revela vía la
--    edge function emergency-verify, post-pago.
-- 2) submit_review: RPC security-definer para que un cliente (anónimo, no hay
--    cuentas de cliente en v1) pueda dejar una reseña desde el perfil. La tabla
--    reviews mantiene escritura service-role-only; este RPC es la única puerta.
-- =============================================================================

-- ── 1. Vista pública sin PII de guardia ──────────────────────────────────────
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

-- ── 2. RPC para dejar reseñas ────────────────────────────────────────────────
-- Validaciones server-side + anti-spam mínimo: máx 3 reseñas por prestador por
-- día en total (v1 no tiene identidad de cliente; suficiente para la cohorte).
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
