-- =============================================================================
-- Storage bucket for provider photos + auth trigger to create provider row
-- =============================================================================

-- ── Storage bucket ────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-photos',
  'provider-photos',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Public read (photos are displayed to clients without auth)
create policy "provider_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'provider-photos');

-- Authenticated providers can upload to their own folder ({user_id}/...)
create policy "provider_photos_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'provider-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated providers can delete their own photos
create policy "provider_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'provider-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Auth trigger — create provider row on signup ──────────────────────────────
-- Reads profile fields from raw_user_meta_data set during supabase.auth.signUp()
-- Runs as security definer so it can bypass RLS on providers table.

create or replace function handle_new_provider()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m jsonb := new.raw_user_meta_data;
begin
  insert into public.providers (
    auth_user_id,
    name,
    phone,
    whatsapp_number,
    ciudad_id,
    rubro_id,
    subscription_tier_id,
    barrio,
    status,
    photos
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_provider();
