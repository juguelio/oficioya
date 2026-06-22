-- =============================================================================
-- Módulo trabajos (jobs) + presupuestos (quotes)
-- Modelo: cliente anónimo publica con WhatsApp + recibe un client_token (link
-- privado de seguimiento). Prestadores activos ofertan gratis con su identidad.
-- El teléfono del cliente NUNCA se expone a los prestadores. El WhatsApp del
-- prestador se revela al cliente sólo cuando acepta su presupuesto.
-- Acceso: vista sanitizada `open_jobs` (board) + RPCs security definer para los
-- caminos sensibles (post, seguimiento por token, aceptar).
-- =============================================================================

-- ── Tablas ──────────────────────────────────────────────────────────────────

create table if not exists jobs (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  rubro_id           text not null references rubros(id),
  ciudad_id          text not null references cities(id),
  barrio             text,
  description        text not null,
  budget_min         integer check (budget_min >= 0),
  budget_max         integer check (budget_max >= 0),
  photos             text[] not null default '{}',
  status             text not null default 'open' check (status in ('open','in_progress','closed')),
  author_name        text not null,
  author_phone       text not null,                       -- privado: nunca se expone a prestadores
  client_token       uuid not null default gen_random_uuid(),  -- link privado del cliente
  accepted_quote_id  uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists jobs_board_idx on jobs (ciudad_id, rubro_id, status, created_at desc);
create index if not exists jobs_token_idx on jobs (client_token);

create table if not exists quotes (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references jobs(id) on delete cascade,
  provider_id     uuid not null references providers(id) on delete cascade,
  amount          integer not null check (amount > 0),
  message         text not null default '',
  estimated_days  integer check (estimated_days >= 0),
  status          text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (job_id, provider_id)   -- un presupuesto por prestador por trabajo
);

create index if not exists quotes_job_idx on quotes (job_id);
create index if not exists quotes_provider_idx on quotes (provider_id);

create trigger jobs_updated_at   before update on jobs   for each row execute function set_updated_at();
create trigger quotes_updated_at before update on quotes for each row execute function set_updated_at();

-- ── Vista sanitizada para el board (sin author_phone ni client_token) ────────

create or replace view open_jobs as
select
  j.id, j.title, j.rubro_id, j.ciudad_id, j.barrio, j.description,
  j.budget_min, j.budget_max, j.photos, j.status, j.author_name, j.created_at,
  (select count(*) from quotes q where q.job_id = j.id) as quote_count
from jobs j;

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table jobs   enable row level security;
alter table quotes enable row level security;

-- jobs: cualquiera puede publicar (cliente anónimo). Sin SELECT directo en la
-- tabla base (los prestadores leen la vista; el cliente usa el RPC por token).
create policy "jobs_insert_anyone"
  on jobs for insert
  with check (status = 'open');

-- quotes: sólo un prestador ACTIVO puede ofertar, y sólo en su propio nombre.
create policy "quotes_insert_active_provider"
  on quotes for insert
  to authenticated
  with check (
    provider_id in (
      select id from providers
      where auth_user_id = auth.uid() and status = 'active'
    )
  );

-- el prestador puede ver el estado de sus propios presupuestos
create policy "quotes_select_own"
  on quotes for select
  to authenticated
  using (
    provider_id in (select id from providers where auth_user_id = auth.uid())
  );

-- ── RPCs (security definer) ──────────────────────────────────────────────────

-- Publicar un trabajo → devuelve id + token del link privado
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
  insert into jobs (title, rubro_id, ciudad_id, description, author_name, author_phone, budget_max, barrio)
  values (p_title, p_rubro, p_ciudad, p_description, p_author_name, p_author_phone, p_budget_max, nullif(p_barrio,''))
  returning id, client_token into new_id, new_token;
  return json_build_object('id', new_id, 'token', new_token);
end;
$$;

-- Seguimiento por token: trabajo + presupuestos (con datos del prestador).
-- El WhatsApp del prestador sólo se incluye en el presupuesto ACEPTADO.
create or replace function get_job_by_token(p_token uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare
  j jobs;
begin
  select * into j from jobs where client_token = p_token;
  if not found then
    return null;
  end if;
  return json_build_object(
    'id', j.id, 'title', j.title, 'rubro_id', j.rubro_id, 'ciudad_id', j.ciudad_id,
    'barrio', j.barrio, 'description', j.description, 'budget_min', j.budget_min,
    'budget_max', j.budget_max, 'status', j.status, 'author_name', j.author_name,
    'created_at', j.created_at, 'accepted_quote_id', j.accepted_quote_id,
    'quotes', coalesce((
      select json_agg(json_build_object(
        'id', q.id, 'amount', q.amount, 'message', q.message,
        'estimated_days', q.estimated_days, 'status', q.status, 'created_at', q.created_at,
        'provider_name', p.name, 'provider_rating', p.rating, 'provider_verified', p.is_verified,
        'provider_phone', case when q.status = 'accepted' then p.whatsapp_number else null end
      ) order by q.created_at desc)
      from quotes q join providers p on p.id = q.provider_id
      where q.job_id = j.id
    ), '[]'::json)
  );
end;
$$;

-- Aceptar un presupuesto (vía token): marca aceptado, rechaza el resto, pone el
-- trabajo en in_progress y devuelve el contacto del prestador elegido.
create or replace function accept_quote_by_token(p_token uuid, p_quote_id uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare
  j_id uuid;
  prov record;
begin
  select id into j_id from jobs where client_token = p_token and status = 'open';
  if not found then
    return json_build_object('error', 'job_not_open');
  end if;
  -- el presupuesto debe pertenecer al trabajo
  if not exists (select 1 from quotes where id = p_quote_id and job_id = j_id) then
    return json_build_object('error', 'quote_not_found');
  end if;

  update quotes set status = 'accepted', updated_at = now() where id = p_quote_id;
  update quotes set status = 'rejected', updated_at = now()
    where job_id = j_id and id <> p_quote_id and status = 'pending';
  update jobs set status = 'in_progress', accepted_quote_id = p_quote_id, updated_at = now()
    where id = j_id;

  select p.name, p.whatsapp_number into prov
  from quotes q join providers p on p.id = q.provider_id
  where q.id = p_quote_id;

  return json_build_object('provider_name', prov.name, 'provider_phone', prov.whatsapp_number);
end;
$$;

-- Permisos de ejecución de los RPC (anon = cliente sin sesión)
grant execute on function post_job(text,text,text,text,text,text,integer,text) to anon, authenticated;
grant execute on function get_job_by_token(uuid) to anon, authenticated;
grant execute on function accept_quote_by_token(uuid,uuid) to anon, authenticated;
grant select on open_jobs to anon, authenticated;
