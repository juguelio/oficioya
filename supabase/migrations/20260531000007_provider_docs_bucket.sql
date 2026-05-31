-- =============================================================================
-- Storage bucket for provider KYC documents (DNI, matrícula, foto trabajando)
-- Private bucket — files are not publicly accessible
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-docs',
  'provider-docs',
  false,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
);

-- Authenticated providers can upload to their own folder ({user_id}/...)
create policy "provider_docs_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'provider-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated providers can read their own documents
create policy "provider_docs_read_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'provider-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated providers can delete their own documents
create policy "provider_docs_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'provider-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
