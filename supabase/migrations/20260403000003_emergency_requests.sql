-- =============================================================================
-- Emergency requests — tracks the full lifecycle of a 24/7 emergency match
-- =============================================================================

create table emergency_requests (
  id                   uuid        primary key default gen_random_uuid(),
  client_phone         text        not null,
  rubro_id             text        not null references rubros(id),
  ciudad_id            text        not null references cities(id),

  status               text        not null default 'searching'
                                   check (status in (
                                     'searching',       -- looking for a provider
                                     'matched',         -- provider accepted, awaiting payment
                                     'payment_pending', -- MP preference created
                                     'completed',       -- payment confirmed, contact revealed
                                     'failed'           -- queue exhausted or client gave up
                                   )),

  -- ordered list of provider UUIDs to try (determined at request creation time)
  provider_queue       uuid[]      not null default '{}',
  current_index        integer     not null default 0 check (current_index >= 0),

  matched_provider_id  uuid        references providers(id),

  -- n8n Wait node resume URL — stored so the WhatsApp router can resume the paused execution
  n8n_resume_url       text,

  -- MercadoPago
  mp_preference_id     text,
  mp_payment_id        text,
  mp_external_reference text,        -- = id, for matching MP callbacks back to this row

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger emergency_requests_updated_at
  before update on emergency_requests
  for each row execute function set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- n8n needs to find the active request by provider phone (for WA response routing)
create index idx_emergency_requests_status
  on emergency_requests (status)
  where status = 'searching';

-- MP callback lookup
create index idx_emergency_requests_mp_ref
  on emergency_requests (mp_external_reference)
  where mp_external_reference is not null;

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- All access from n8n via service role key — no client-facing RLS needed yet.
-- Service role bypasses RLS by definition.

alter table emergency_requests enable row level security;

-- No policies = no public access. n8n uses service_role key, bypasses RLS.
