-- =============================================================================
-- Cuentas de cliente (opcionales) para el módulo de trabajos.
--
-- El flujo anónimo (nombre + WhatsApp + client_token) SIGUE IGUAL y es el camino
-- sin fricción. Lo nuevo: si el que publica tiene sesión, el trabajo queda
-- vinculado a su cuenta (jobs.client_user_id = auth.uid()) y puede ver todos sus
-- trabajos en /mis-trabajos vía get_my_jobs(), sin depender del link con token.
--
-- La cuenta de cliente es un auth.users con metadata account_type='cliente' y
-- SIN fila en providers — el guard de handle_new_provider (phone/ciudad/rubro
-- vacíos) ya la deja pasar sin crear prestador; no hace falta tocar el trigger.
--
-- post_job se reescribe partiendo de la definición VIVA (pg_get_functiondef,
-- verificada 2026-08-01): misma firma, mismo retorno; sólo agrega client_user_id.
-- =============================================================================

alter table jobs add column if not exists client_user_id uuid references auth.users(id) on delete set null;
create index if not exists jobs_client_user_idx on jobs (client_user_id, created_at desc);

create or replace function post_job(
  p_title       text,
  p_rubro       text,
  p_ciudad      text,
  p_description text,
  p_author_name text,
  p_author_phone text,
  p_budget_max  integer default null,
  p_barrio      text default null
) returns json
language plpgsql security definer set search_path = public as $$
declare
  new_id    uuid;
  new_token uuid;
begin
  insert into jobs (title, rubro_id, ciudad_id, description, author_name, author_phone, budget_max, barrio, client_user_id)
  values (p_title, p_rubro, p_ciudad, p_description, p_author_name, p_author_phone, p_budget_max, nullif(p_barrio,''), auth.uid())
  returning id, client_token into new_id, new_token;
  return json_build_object('id', new_id, 'token', new_token);
end;
$$;

-- Mis trabajos: sólo los del usuario logueado. Incluye client_token porque el
-- dueño ES el cliente — le sirve para abrir su link de seguimiento.
create or replace function get_my_jobs()
returns json
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return '[]'::json;
  end if;
  return coalesce((
    select json_agg(json_build_object(
      'id', j.id,
      'title', j.title,
      'rubro_id', j.rubro_id,
      'ciudad_id', j.ciudad_id,
      'status', j.status,
      'created_at', j.created_at,
      'client_token', j.client_token,
      'quote_count', (select count(*) from quotes q where q.job_id = j.id)
    ) order by j.created_at desc)
    from jobs j
    where j.client_user_id = auth.uid()
  ), '[]'::json);
end;
$$;

grant execute on function get_my_jobs() to authenticated;
