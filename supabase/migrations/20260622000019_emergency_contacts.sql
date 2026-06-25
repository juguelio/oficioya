-- =============================================================================
-- Paywall de emergencias (§8): el cliente paga $20.000 ARS por contactar a un prestador
-- en guardia, ANTES de revelar el WhatsApp. MercadoPago Checkout Pro.
--
-- ⚠️ GUARDRAIL PII: emergency_contacts guarda el cruce cliente↔prestador. RLS habilitado
--    SIN policies para anon/authenticated → SÓLO el service_role (las edge functions) accede.
--    El WhatsApp del prestador se revela únicamente vía edge function tras pago aprobado.
-- =============================================================================

create table if not exists emergency_contacts (
  id            uuid        primary key default gen_random_uuid(),
  provider_id   uuid        not null references providers(id) on delete cascade,
  reference     uuid        not null unique default gen_random_uuid(),  -- external_reference de MP
  amount        integer     not null default 20000,                     -- ARS, revisar c/3 meses
  status        text        not null default 'pending'
                            check (status in ('pending', 'approved', 'rejected', 'expired')),
  mp_payment_id text,
  buyer_phone   text,       -- opcional, si el cliente lo deja
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);

create index if not exists emergency_contacts_reference_idx on emergency_contacts (reference);
create index if not exists emergency_contacts_provider_idx  on emergency_contacts (provider_id, created_at desc);

alter table emergency_contacts enable row level security;
-- Sin policies a propósito: ni anon ni authenticated pueden leer/escribir. Sólo service_role.
revoke all on emergency_contacts from anon, authenticated;
