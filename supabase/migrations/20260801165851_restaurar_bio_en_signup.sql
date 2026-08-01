-- =============================================================================
-- Restaura `bio` en el INSERT de handle_new_provider().
--
-- 20260619000009_provider_bio_on_signup agregó bio al trigger, y las reescrituras
-- posteriores de la función (claim_creates_account, allow_oauth_users_without_provider,
-- signup_publica_directo y restaurar_guard_oauth_en_signup) la fueron perdiendo:
-- cada una partió de una copia vieja en vez de la definición viva. Síntoma: el
-- onboarding pide "contame qué hacés" pero la bio nunca llegaba a providers y el
-- perfil quedaba sin "Sobre tu trabajo".
--
-- Esta versión = la de restaurar_guard_oauth_en_signup (guard OAuth + alta 'active'
-- + camino claim_token) + bio. Verificada contra pg_get_functiondef de producción.
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

  -- Alta normal desde /registro/prestador: fila directa a 'active'.
  insert into public.providers (
    auth_user_id, name, phone, whatsapp_number, ciudad_id, rubro_id,
    subscription_tier_id, barrio, bio, status, photos
  ) values (
    new.id,
    m->>'name',
    m->>'phone',
    coalesce(nullif(m->>'whatsapp_number', ''), m->>'phone'),
    m->>'ciudad_id',
    m->>'rubro_id',
    nullif(m->>'subscription_tier_id', ''),
    nullif(m->>'barrio', ''),
    nullif(m->>'bio', ''),
    'active',
    '{}'
  );
  return new;
end;
$$;
