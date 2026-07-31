-- =============================================================================
-- OAuth puede crear una identidad Auth antes de que exista un perfil de
-- prestador. El trigger sólo debe crear `providers` cuando el alta trae los
-- campos mínimos del onboarding; de otro modo un login con Google abortaba con
-- un NOT NULL de providers y la cuenta ni siquiera podía autenticarse.
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

  -- Login OAuth o futura cuenta cliente: Auth queda creado, pero no se crea un
  -- prestador incompleto. El onboarding normal siempre aporta estos campos.
  if coalesce(nullif(trim(m->>'name'), ''), '') = ''
     or coalesce(nullif(trim(m->>'phone'), ''), '') = ''
     or coalesce(nullif(trim(m->>'ciudad_id'), ''), '') = ''
     or coalesce(nullif(trim(m->>'rubro_id'), ''), '') = '' then
    return new;
  end if;

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
    'pending',
    '{}'
  );
  return new;
end;
$$;
