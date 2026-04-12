-- =============================================================================
-- Oficio — Initial schema
-- Cities, rubros, subscription tiers, and providers
-- =============================================================================

-- ── Cities ────────────────────────────────────────────────────────────────────

create table cities (
  id            text        primary key,
  label         text        not null,
  phone_prefix  text        not null,
  lat           numeric(8,4) not null,
  lng           numeric(8,4) not null
);

insert into cities (id, label, phone_prefix, lat, lng) values
  ('san-martin',         'San Martín de los Andes', '+5492972', -40.1573, -71.3520),
  ('villa-la-angostura', 'Villa La Angostura',      '+5492972', -40.7583, -71.6466),
  ('bariloche',          'Bariloche',               '+5492944', -41.1335, -71.3103);

-- ── Rubros ────────────────────────────────────────────────────────────────────

create table rubros (
  id    text primary key,
  label text not null,
  icon  text not null
);

insert into rubros (id, label, icon) values
  ('electricista',    'Electricista',       '⚡'),
  ('plomero',         'Plomero',            '🔧'),
  ('gasista',         'Gasista',            '🔥'),
  ('carpintero',      'Carpintero',         '🪚'),
  ('albanil',         'Albañil',            '🧱'),
  ('pintor',          'Pintor',             '🖌️'),
  ('cerrajero',       'Cerrajero',          '🔑'),
  ('jardinero',       'Jardinero',          '🌿'),
  ('calefaccionista', 'Calefaccionista',    '♨️'),
  ('herrero',         'Herrero',            '⚙️'),
  ('techista',        'Techista',           '🏗️'),
  ('tecnico-pc',      'Técnico en PC',      '💻'),
  ('flete',           'Flete / Mudanza',    '🚛'),
  ('leniero',         'Leñero',             '🪵'),
  ('limpieza',        'Limpieza',           '🧹'),
  ('cabanas',         'Mant. de cabañas',   '🏕️');

-- ── Subscription tiers ────────────────────────────────────────────────────────

create table subscription_tiers (
  id                  text    primary key,
  label               text    not null,
  price_ars           integer not null check (price_ars > 0),
  -- null means unlimited
  contacts_per_month  integer check (contacts_per_month > 0),
  has_badge           boolean not null default false,
  priority            text    not null default 'normal'
                              check (priority in ('normal', 'alta', 'maxima'))
);

insert into subscription_tiers (id, label, price_ars, contacts_per_month, has_badge, priority) values
  ('basico',       'Básico',       20000, 8,    false, 'normal'),
  ('profesional',  'Profesional',  35000, null, true,  'alta'),
  ('destacado',    'Destacado',    55000, null, true,  'maxima');

-- ── Providers ─────────────────────────────────────────────────────────────────

create table providers (
  id                    uuid        primary key default gen_random_uuid(),

  -- links to Supabase Auth — null while in 'pending' / pre-signup states
  auth_user_id          uuid        references auth.users(id) on delete set null,

  name                  text        not null,
  phone                 text        not null,
  -- may differ from phone (some workers use a separate WhatsApp line)
  whatsapp_number       text        not null,

  ciudad_id             text        not null references cities(id),
  rubro_id              text        not null references rubros(id),
  subscription_tier_id  text        references subscription_tiers(id),

  barrio                text,
  bio                   text,

  rating                numeric(3,1) not null default 0.0
                                     check (rating >= 0.0 and rating <= 5.0),
  total_jobs            integer     not null default 0
                                    check (total_jobs >= 0),

  is_verified           boolean     not null default false,
  -- guardia toggle — provider activates this from their dashboard
  is_emergency_available boolean    not null default false,

  status                text        not null default 'pending'
                                    check (status in ('active', 'inactive', 'pending')),

  photos                text[]      not null default '{}',
  lat                   numeric(9,6),
  lng                   numeric(9,6),

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- keep updated_at current automatically
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger providers_updated_at
  before update on providers
  for each row execute function set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- primary query pattern: list providers by city + rubro, active only
create index idx_providers_ciudad_rubro
  on providers (ciudad_id, rubro_id)
  where status = 'active';

-- guardia listing (emergency page)
create index idx_providers_emergency
  on providers (ciudad_id, is_emergency_available)
  where status = 'active' and is_emergency_available = true;

-- auth lookup (provider managing their own row)
create index idx_providers_auth_user
  on providers (auth_user_id)
  where auth_user_id is not null;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table cities             enable row level security;
alter table rubros             enable row level security;
alter table subscription_tiers enable row level security;
alter table providers          enable row level security;

-- ── Lookup tables: read-only for everyone ────────────────────────────────────

create policy "cities_select_all"
  on cities for select
  using (true);

create policy "rubros_select_all"
  on rubros for select
  using (true);

create policy "subscription_tiers_select_all"
  on subscription_tiers for select
  using (true);

-- ── Providers: clients read active rows, providers manage their own ──────────

-- anon + authenticated: see active providers
create policy "providers_select_active"
  on providers for select
  using (status = 'active');

-- authenticated providers can also see their own row regardless of status
create policy "providers_select_own"
  on providers for select
  using (auth.uid() = auth_user_id);

-- a provider can only insert a row linked to their own auth user
create policy "providers_insert_own"
  on providers for insert
  with check (auth.uid() = auth_user_id);

-- a provider can only update their own row
create policy "providers_update_own"
  on providers for update
  using  (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- a provider can only delete their own row
create policy "providers_delete_own"
  on providers for delete
  using (auth.uid() = auth_user_id);
