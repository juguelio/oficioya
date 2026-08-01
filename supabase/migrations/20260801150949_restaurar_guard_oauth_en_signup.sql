-- =============================================================================
-- Restaura el guard OAuth que 20260731181952_signup_publica_directo pisó.
--
-- QUÉ PASÓ: la migración del alta directa a 'active' reescribió
-- handle_new_provider() partiendo de la versión ANTERIOR a
-- 20260730210000_allow_oauth_users_without_provider, y perdió el guard que
-- saltea el INSERT cuando el alta no trae los campos del onboarding.
-- Resultado: un login de Google con email nuevo (metadata sin phone/ciudad/rubro)
-- violaba el NOT NULL de providers.phone, el trigger abortaba y GoTrue devolvía
-- "500: Database error saving new user" — la cuenta de Auth ni se creaba y el
-- usuario rebotaba al login. Visto en logs de Auth el 2026-08-01 14:44 UTC.
--
-- QUÉ HACE: misma función que 20260731181952 (alta directa a 'active' + camino
-- claim_token) pero con el guard de 20260730210000: si faltan name/phone/
-- ciudad_id/rubro_id, la cuenta Auth se crea SIN fila de prestador, y la fila la
-- crea después el onboarding conversacional (camino "con sesión").
-- =============================================================================

create or replace function handle_new_provider()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m jsonb := new.raw_user_meta_data;
  t uuid  := nullif(m->>'claim_token', '')::uuid;
  n integer;
begin
  if t is not null then
    -- Camino "activación" desde /activar/:id — adopta la fila ya existente.
    update providers set
      auth_user_id    = new.id,
      status          = 'active',
      whatsapp_number = coalesce(nullif(trim(m->>'whatsapp_number'), ''), whatsapp_number),
      claimed_at      = now(),
      claim_token     = null,
      updated_at      = now()
    where claim_token = t
      and auth_user_id is null;

    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'claim_token_invalido_o_ya_usado';
    end if;

    return new;
  end if;

  -- Login OAuth (Google no manda phone/ciudad/rubro) o futura cuenta cliente:
  -- la cuenta Auth queda creada, pero NO se crea un prestador incompleto.
  -- El onboarding conversacional aporta estos campos y crea la fila después.
  if coalesce(nullif(trim(m->>'name'), ''), '') = ''
     or coalesce(nullif(trim(m->>'phone'), ''), '') = ''
     or coalesce(nullif(trim(m->>'ciudad_id'), ''), '') = ''
     or coalesce(nullif(trim(m->>'rubro_id'), ''), '') = '' then
    return new;
  end if;

  -- Alta normal desde /registro/prestador: fila directa a 'active' (sin cola de
  -- aprobación — ver 20260731181952_signup_publica_directo).
  insert into public.providers (
    auth_user_id, name, phone, whatsapp_number, ciudad_id, rubro_id,
    subscription_tier_id, barrio, status, photos
  ) values (
    new.id,
    m->>'name',
    m->>'phone',
    coalesce(nullif(m->>'whatsapp_number', ''), m->>'phone'),
    m->>'ciudad_id',
    m->>'rubro_id',
    nullif(m->>'subscription_tier_id', ''),
    nullif(m->>'barrio', ''),
    'active',
    '{}'
  );
  return new;
end;
$$;
