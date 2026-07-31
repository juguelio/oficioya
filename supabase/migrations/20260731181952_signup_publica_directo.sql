-- =============================================================================
-- El alta de prestador pasa a publicarse directo (status 'active').
--
-- POR QUÉ: el trigger creaba la fila como 'pending' y `providers_public` sólo expone
-- 'active' y 'unclaimed'. Como no existe ninguna pantalla de aprobación, nadie salía
-- nunca de 'pending': el prestador se registraba, entraba a su panel, y en la web no
-- aparecía jamás. Un portón sin portero. Detectado con un alta real de prueba
-- (tecnico-pc en san-martin) que no figuraba en el listado.
--
-- En etapa de captación de oferta la fricción cuesta más que el filtro. El control de
-- calidad queda en `is_verified` (badge ✓), que no tapa el perfil sino que lo distingue.
-- Si más adelante hace falta moderar, se vuelve a 'pending' y se suma la cola de revisión
-- — pero la cola hay que construirla ANTES de volver a cerrar el portón.
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

  -- Alta normal desde /registro/prestador.
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

-- Rescata a los que ya se registraron y quedaron encajonados en 'pending'.
update providers
   set status = 'active', updated_at = now()
 where status = 'pending'
   and auth_user_id is not null;
