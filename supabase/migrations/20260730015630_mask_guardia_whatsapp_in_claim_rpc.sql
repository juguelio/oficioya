-- =============================================================================
-- get_claimable_by_token deja de exponer el whatsapp de un prestador ya reclamado.
--
-- POR QUÉ: devolvía `whatsapp_number` sin mirar el status, así que era un SEGUNDO camino
-- al número de un prestador en guardia, salteando el paywall de $20.000. El claim link se
-- manda por WhatsApp (se puede reenviar) y el token sigue resolviendo después de reclamado,
-- así que quien conservara el link viejo podía leer el número una vez que el prestador
-- prendía el modo guardia. La 20260730013415 tapó ese dato en la vista pero no acá.
--
-- Ahora el número sale sólo con status='unclaimed', que es el único caso donde la página de
-- claim lo necesita (pre-llenar el input para que confirme o corrija). Ya reclamado,
-- ClaimProfilePage renderiza la pantalla de "perfil activo" y no usa el campo.
-- =============================================================================

create or replace function get_claimable_by_token(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare pr providers;
begin
  select * into pr from providers where claim_token = p_token;
  if not found then return null; end if;
  return json_build_object(
    'id', pr.id, 'name', pr.name, 'rubro_id', pr.rubro_id, 'ciudad_id', pr.ciudad_id,
    'whatsapp_number', case when pr.status = 'unclaimed' then pr.whatsapp_number else null end,
    'external_rating', pr.external_rating,
    'external_reviews', pr.external_reviews, 'status', pr.status,
    'already_claimed', (pr.status = 'active')
  );
end; $$;

grant execute on function get_claimable_by_token(uuid) to anon, authenticated;
