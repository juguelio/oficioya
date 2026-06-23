-- =============================================================================
-- Loop de referidos: cada prestador que se da de alta puede recomendar 1-2 colegas.
-- Los referidos entran a `prospects` con source='referral' (warm lead → alta prioridad)
-- y referred_by = nombre del que refirió. Si el referido YA estaba en la base, se le
-- suma 'referral' a sources (sube su source_count = prioridad). El flywheel: oferta
-- genera oferta.
--
-- La RPC es callable por ANON (el onboarding corre con la anon key del browser), pero
-- es SECURITY DEFINER y SÓLO inserta (no devuelve datos de prospects → no hay fuga PII,
-- a diferencia del leak de la 015). Defensiva: cap de 5, valida teléfono.
-- =============================================================================

alter table prospects add column if not exists referred_by text;

create or replace function submit_referral(p_referrer text, p_ciudad text, p_referrals jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  r jsonb; k text; ph text; nm text; ru text;
  n integer := 0; i integer := 0;
  referrer text := nullif(trim(coalesce(p_referrer, '')), '');
  ciudad   text := coalesce(nullif(trim(coalesce(p_ciudad, '')), ''), 'san-martin');
begin
  if jsonb_typeof(p_referrals) <> 'array' then return 0; end if;

  for r in select * from jsonb_array_elements(p_referrals) loop
    i := i + 1;
    if i > 5 then exit; end if;  -- cap anti-abuso

    k := right(regexp_replace(coalesce(r->>'phone', ''), '\D', '', 'g'), 10);
    if length(k) < 10 then continue; end if;  -- teléfono inválido

    ph := '+' || regexp_replace(coalesce(r->>'phone', ''), '\D', '', 'g');
    nm := nullif(trim(coalesce(r->>'name', '')), '');
    ru := nullif(trim(coalesce(r->>'rubro', '')), '');

    insert into prospects (name, phone, phone_key, rubro, ciudad, source, sources,
                           referred_by, notas, status)
    values (coalesce(nm, '(referido)'), ph, k, ru, ciudad,
            'referral', array['referral'],
            referrer, 'referido por ' || coalesce(referrer, 'un colega'), 'nuevo')
    on conflict (phone_key) do update set
      sources     = (select array(select distinct unnest(prospects.sources || array['referral']))),
      referred_by = coalesce(prospects.referred_by, excluded.referred_by),
      name        = coalesce(nullif(prospects.name, ''), excluded.name),
      updated_at  = now();

    n := n + 1;
  end loop;

  return n;
end;
$$;

-- Sólo ejecutar (no leer). Anon lo necesita porque el onboarding corre con anon key.
revoke all on function submit_referral(text, text, jsonb) from public;
grant execute on function submit_referral(text, text, jsonb) to anon, authenticated;
