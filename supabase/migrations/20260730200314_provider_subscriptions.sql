-- Suscripción de prestadores (MP preapproval, débito automático). Mismo blindaje PII que
-- emergency_contacts: RLS sin policies + revoke → solo service_role (edge functions) accede.
create table if not exists provider_subscriptions (
  id                 uuid        primary key default gen_random_uuid(),
  provider_id        uuid        not null references providers(id) on delete cascade,
  tier_id            text        not null references subscription_tiers(id),
  mp_preapproval_id  text        unique,
  status             text        not null default 'pending'
                                 check (status in ('pending','authorized','paused','cancelled')),
  current_period_end timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists provider_subscriptions_provider_idx on provider_subscriptions (provider_id, created_at desc);
create index if not exists provider_subscriptions_preapproval_idx on provider_subscriptions (mp_preapproval_id);

alter table provider_subscriptions enable row level security;
revoke all on provider_subscriptions from anon, authenticated;

-- El prestador logueado consulta SU estado sin leer la tabla directo (security definer,
-- filtra por auth_user_id). Devuelve la suscripción más reciente.
create or replace function get_my_subscription()
returns table (tier_id text, status text, current_period_end timestamptz)
language sql security definer set search_path = public as $$
  select ps.tier_id, ps.status, ps.current_period_end
  from provider_subscriptions ps
  join providers p on p.id = ps.provider_id
  where p.auth_user_id = auth.uid()
  order by ps.created_at desc
  limit 1
$$;
revoke all on function get_my_subscription() from anon;
grant execute on function get_my_subscription() to authenticated;
