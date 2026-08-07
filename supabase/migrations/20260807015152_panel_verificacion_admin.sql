-- =============================================================================
-- Panel de verificación para el admin.
--
-- El plan de lanzamiento dice que cada prestador que engancha termina en
-- "marcar is_verified a mano" desde el dashboard de Supabase. Con 15 altas en
-- una semana eso es tolerable; con la cohorte fundadora entera, no. Y mirar los
-- documentos exige abrir Storage y armar URLs firmadas de a una.
--
-- Modelo de permisos: `is_admin()` es la única fuente de verdad. Chequea una
-- allowlist de emails del dueño (sobrevive a que se borre y recree la cuenta,
-- que ya pasó) O la tabla admin_users para sumar gente después.
-- =============================================================================

create table if not exists admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nota       text,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;
-- Sin políticas: nadie la lee ni la escribe desde el cliente. Sólo la tocan las
-- funciones security definer de abajo y el dueño desde el dashboard.

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and (
        u.email = any (array[
          'joaquin.apostolo@gmail.com',
          'patagoniasounds@gmail.com',
          'steadystateradio@gmail.com'
        ])
        or exists (select 1 from admin_users a where a.user_id = u.id)
      )
  );
$$;

create or replace function admin_provider_queue()
returns json
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then
    return '[]'::json;
  end if;
  return coalesce((
    select json_agg(json_build_object(
      'id',              p.id,
      'name',            p.name,
      'ciudad_id',       p.ciudad_id,
      'rubro_id',        p.rubro_id,
      'whatsapp_number', p.whatsapp_number,
      'bio',             p.bio,
      'is_verified',     p.is_verified,
      'claimed_at',      p.claimed_at,
      'created_at',      p.created_at,
      'docs', coalesce((
        select json_agg(json_build_object('path', o.name, 'subido', o.created_at) order by o.created_at)
        from storage.objects o
        where o.bucket_id = 'provider-docs'
          and (storage.foldername(o.name))[1] = p.auth_user_id::text
      ), '[]'::json)
    ) order by p.is_verified, p.claimed_at desc nulls last, p.created_at desc)
    from providers p
    where p.auth_user_id is not null
      and p.status = 'active'
  ), '[]'::json);
end;
$$;

create or replace function admin_set_verified(p_provider_id uuid, p_verified boolean)
returns json
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then
    return json_build_object('error', 'no_autorizado');
  end if;
  update providers
     set is_verified = p_verified, updated_at = now()
   where id = p_provider_id;
  if not found then
    return json_build_object('error', 'prestador_inexistente');
  end if;
  return json_build_object('ok', true, 'is_verified', p_verified);
end;
$$;

-- El admin necesita LEER los documentos de cualquier prestador; la política
-- existente sólo deja ver la carpeta propia.
drop policy if exists provider_docs_read_admin on storage.objects;
create policy provider_docs_read_admin
  on storage.objects for select
  using (bucket_id = 'provider-docs' and public.is_admin());

grant execute on function is_admin() to authenticated;
grant execute on function admin_provider_queue() to authenticated;
grant execute on function admin_set_verified(uuid, boolean) to authenticated;
