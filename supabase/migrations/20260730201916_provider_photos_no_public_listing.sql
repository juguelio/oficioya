-- =============================================================================
-- El bucket provider-photos permitía LISTAR todo su contenido.
--
-- POR QUÉ: `provider_photos_public_read` daba SELECT sobre storage.objects al rol
-- `public` para todo el bucket. Eso no hace falta para mostrar una foto — habilita
-- listar. Como los objetos van a <auth_user_id>/<timestamp>.ext, el listado exponía
-- los ids de usuario de todos los prestadores y cada foto que hayan subido alguna
-- vez, incluidas las reemplazadas (el upload no borra la anterior).
--
-- POR QUÉ ES SEGURO: el bucket es público, y las URLs /storage/v1/object/public/...
-- se sirven sin pasar por RLS. Las fotos se siguen viendo en la web igual.
-- Verificado que ningún cliente llama a `.list()` sobre este bucket: los tres usos
-- (ProviderSignup, ConversationalOnboarding, ProviderProfileEdit) sólo hacen
-- `.upload()` + `.getPublicUrl()`.
--
-- Se deja lectura acotada a la carpeta propia, mismo patrón que provider-docs, para
-- que el panel pueda listar las fotos del prestador logueado el día que haga falta.
--
-- Linter: 0025_public_bucket_allows_listing
-- =============================================================================

drop policy if exists "provider_photos_public_read" on storage.objects;

create policy "provider_photos_read_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'provider-photos'
    and (storage.foldername(name))[1] = (auth.uid())::text
  );
