-- =============================================================================
-- RPC: find_emergency_request_by_provider_phone
-- Used by the WhatsApp response router to look up the active request that
-- is currently waiting on a given provider's response.
-- =============================================================================

create or replace function find_emergency_request_by_provider_phone(p_phone text)
returns table (
  id                   uuid,
  client_phone         text,
  rubro_id             text,
  ciudad_id            text,
  matched_provider_id  uuid,
  n8n_resume_url       text,
  status               text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      er.id,
      er.client_phone,
      er.rubro_id,
      er.ciudad_id,
      er.matched_provider_id,
      er.n8n_resume_url,
      er.status
    from emergency_requests er
    -- the provider whose phone sent the WhatsApp reply is in the queue at current_index
    join providers pr
      on pr.id = er.provider_queue[er.current_index + 1]  -- postgres arrays are 1-indexed
    where
      er.status         = 'searching'
      and er.n8n_resume_url is not null
      and (pr.phone = p_phone or pr.whatsapp_number = p_phone)
    order by er.created_at desc
    limit 1;
end;
$$;
