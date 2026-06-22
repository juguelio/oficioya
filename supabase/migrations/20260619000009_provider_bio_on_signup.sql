-- =============================================================================
-- Persistir `bio` al crear el prestador en el signup.
-- El onboarding conversacional (/registro/prestador) recolecta una bio corta,
-- pero handle_new_provider() no la insertaba y se perdía. Esta migración
-- reemplaza la función para incluir bio (resto idéntico a la versión original).
-- =============================================================================

create or replace function handle_new_provider()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m jsonb := new.raw_user_meta_data;
begin
  insert into public.providers (
    auth_user_id,
    name,
    phone,
    whatsapp_number,
    ciudad_id,
    rubro_id,
    subscription_tier_id,
    barrio,
    bio,
    status,
    photos
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
    'pending',
    '{}'
  );
  return new;
end;
$$;
