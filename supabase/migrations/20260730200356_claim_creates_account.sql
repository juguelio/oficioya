-- =============================================================================
-- Activar un perfil pre-armado ahora CREA LA CUENTA del prestador.
--
-- POR QUÉ: el plan de lanzamiento es armar perfiles nosotros (crawl de prospects
-- + alta manual) y mandarlos por WhatsApp. Pero `claim_provider` sólo pasaba la
-- fila de 'unclaimed' a 'active': nunca tocaba `auth_user_id`. Resultado: el
-- prestador podía "activar" su perfil y quedarse sin forma de entrar al panel,
-- porque el ÚNICO camino a `auth_user_id` era el trigger de signup — y el signup
-- crea una fila NUEVA, dejando el perfil armado huérfano y duplicado.
--
-- CÓMO: en vez de una RPC nueva que necesite service_role para crear el usuario,
-- se extiende el trigger que ya existe. El cliente llama a supabase.auth.signUp()
-- con `claim_token` en la metadata; el trigger ve el token y ADOPTA la fila
-- existente en lugar de insertar una. Un solo camino, sin edge function.
--
-- Nota sobre `already_claimed`: pasaba por `status = 'active'`, lo que asumía que
-- todo perfil publicado tiene dueño. Falso para los que damos de alta a mano
-- (activos y sin `auth_user_id`). La condición correcta es `auth_user_id is not null`.
-- =============================================================================

-- ── 1) El trigger adopta la fila cuando viene un claim_token ──────────────────
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
    -- Camino "activación": el perfil ya existe, sólo le colgamos el dueño.
    -- `auth_user_id is null` (y no `status='unclaimed'`) para que sirva tanto
    -- para los perfiles del crawl como para los que cargamos a mano ya activos.
    update providers set
      auth_user_id    = new.id,
      status          = 'active',
      whatsapp_number = coalesce(nullif(trim(m->>'whatsapp_number'), ''), whatsapp_number),
      claimed_at      = now(),
      claim_token     = null,          -- link de un solo uso
      updated_at      = now()
    where claim_token = t
      and auth_user_id is null;

    get diagnostics n = row_count;
    if n = 0 then
      -- Aborta el insert en auth.users: sin fila adoptada no queremos un usuario
      -- suelto que después no resuelva ningún prestador.
      raise exception 'claim_token_invalido_o_ya_usado';
    end if;

    return new;
  end if;

  -- Camino alta normal (/registro/prestador) — sin cambios.
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

-- ── 2) get_claimable_by_token: "reclamado" = tiene dueño ─────────────────────
-- El whatsapp se sigue ocultando para prestadores en guardia (paywall de $20.000,
-- ver 20260730015630); acá sólo se cambia el criterio de "ya reclamado".
create or replace function get_claimable_by_token(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare pr providers;
begin
  select * into pr from providers where claim_token = p_token;
  if not found then return null; end if;
  return json_build_object(
    'id', pr.id, 'name', pr.name, 'rubro_id', pr.rubro_id, 'ciudad_id', pr.ciudad_id,
    'whatsapp_number', case
                         when pr.auth_user_id is null and not pr.is_emergency_available
                         then pr.whatsapp_number
                         else null
                       end,
    'external_rating',  pr.external_rating,
    'external_reviews', pr.external_reviews,
    'status',           pr.status,
    'already_claimed',  (pr.auth_user_id is not null)
  );
end; $$;

grant execute on function get_claimable_by_token(uuid) to anon, authenticated;

-- ── 3) claim_provider queda sin llamadores ───────────────────────────────────
-- Activaba el perfil SIN crear cuenta: exactamente el agujero que cierra esta
-- migración. ClaimProfilePage ya no la usa. Se le saca el grant a anon para que
-- nadie con un token viejo publique un perfil sin dueño.
-- ⚠️ Hay que revocar de PUBLIC, no sólo de anon/authenticated: Postgres otorga
-- EXECUTE a PUBLIC por defecto en toda función, así que revocarle a los roles
-- nominados deja la RPC igual de abierta (verificable en pg_proc.proacl: '=X/postgres').
-- Para revertir: grant execute on function claim_provider(uuid, text) to anon, authenticated;
revoke execute on function claim_provider(uuid, text) from public, anon, authenticated;

-- ── 4) Alta manual de perfiles + link de activación ──────────────────────────
-- El alta manual es parte del plan de lanzamiento, no una excepción: armamos el
-- perfil nosotros y se lo mandamos hecho. Estas dos funciones evitan escribir el
-- INSERT a mano y, sobre todo, evitan olvidarse del claim_token (sin token no hay
-- link de activación y el perfil queda inalcanzable para su dueño).
-- service_role solamente. Desde el SQL Editor corren porque va como postgres.

create or replace function admin_create_profile(
  p_name     text,
  p_phone    text,                       -- +549XXXXXXXXXX
  p_ciudad   text,
  p_rubro    text,
  p_bio      text default null,
  p_barrio   text default null,
  p_tier     text default null,          -- 'basico' | 'profesional' | 'destacado' | null
  p_photo    text default null,          -- ruta o URL, ej '/images/foo.png'
  p_publicar boolean default false       -- false = 'unclaimed' (whatsapp oculto hasta que active)
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_id    uuid;
  v_token uuid := gen_random_uuid();
  v_dup   text;
begin
  -- match por los últimos 10 dígitos: el mismo criterio que build_claimable_profiles
  select pr.name into v_dup from providers pr
   where right(regexp_replace(pr.whatsapp_number, '\D', '', 'g'), 10)
       = right(regexp_replace(p_phone, '\D', '', 'g'), 10)
   limit 1;
  if v_dup is not null then
    return json_build_object('ok', false, 'error', 'telefono_ya_existe', 'name', v_dup);
  end if;

  insert into providers (
    name, phone, whatsapp_number, ciudad_id, rubro_id, subscription_tier_id,
    barrio, bio, status, is_verified, claim_token, photos
  ) values (
    p_name, p_phone, p_phone, p_ciudad, p_rubro, nullif(p_tier, ''),
    nullif(p_barrio, ''), nullif(p_bio, ''),
    case when p_publicar then 'active' else 'unclaimed' end,
    false, v_token,
    case when p_photo is null then '{}'::text[] else array[p_photo] end
  )
  returning id into v_id;

  return json_build_object(
    'ok', true, 'id', v_id, 'claim_token', v_token,
    'link', 'https://oficioya.app/activar/' || v_id || '#t=' || v_token
  );
end; $$;

revoke all on function admin_create_profile(text,text,text,text,text,text,text,text,boolean) from public, anon, authenticated;
grant execute on function admin_create_profile(text,text,text,text,text,text,text,text,boolean) to service_role;

-- Para perfiles que YA existen sin token (los cargados a mano antes de esto).
-- Regenera el token si el link se perdió; devuelve null si el perfil ya tiene dueño.
create or replace function admin_issue_claim_link(p_provider_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare pr providers; v_token uuid;
begin
  select * into pr from providers where id = p_provider_id;
  if not found then return json_build_object('ok', false, 'error', 'no_existe'); end if;
  if pr.auth_user_id is not null then
    return json_build_object('ok', false, 'error', 'ya_tiene_dueno');
  end if;

  v_token := coalesce(pr.claim_token, gen_random_uuid());
  update providers set claim_token = v_token, updated_at = now() where id = pr.id;

  return json_build_object(
    'ok', true, 'id', pr.id, 'name', pr.name, 'claim_token', v_token,
    'link', 'https://oficioya.app/activar/' || pr.id || '#t=' || v_token
  );
end; $$;

revoke all on function admin_issue_claim_link(uuid) from public, anon, authenticated;
grant execute on function admin_issue_claim_link(uuid) to service_role;
