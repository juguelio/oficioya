-- =============================================================================
-- outreach_log
-- Tracks every WhatsApp outreach attempt to a provider: message sent,
-- response received, classified intent, and conversion state.
-- =============================================================================

create table if not exists outreach_log (
  id                      uuid primary key default gen_random_uuid(),

  -- Who was contacted
  provider_id             uuid references providers(id) on delete set null,
  provider_phone          text not null,

  -- Outbound message
  message_sent            text not null,
  sent_at                 timestamptz not null default now(),

  -- Inbound response (populated by the incoming message handler)
  response_text           text,
  response_at             timestamptz,
  audio_local_path        text,           -- set if response was a voice note

  -- Claude classification
  intent                  text check (intent in (
                            'interested',
                            'not_now',
                            'price_question',
                            'registered',
                            'objection',
                            'unclassified'
                          )),
  suggested_reply         text,           -- Claude's proposed follow-up text
  replied_at              timestamptz,    -- when suggested_reply was actually sent

  -- Follow-up scheduling
  follow_up_scheduled_at  timestamptz,

  -- Conversion
  converted               boolean not null default false,
  converted_at            timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Index for the incoming message handler lookup (phone → open log entry)
create index outreach_log_provider_phone_idx on outreach_log (provider_phone);

-- Index for follow-up scheduler query
create index outreach_log_follow_up_idx
  on outreach_log (follow_up_scheduled_at)
  where follow_up_scheduled_at is not null and converted = false;

-- Auto-update updated_at
create or replace function touch_outreach_log()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger outreach_log_updated_at
  before update on outreach_log
  for each row execute function touch_outreach_log();

-- RLS: service role only (n8n uses service role key; no client-side access needed)
alter table outreach_log enable row level security;

create policy "service role full access"
  on outreach_log
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
