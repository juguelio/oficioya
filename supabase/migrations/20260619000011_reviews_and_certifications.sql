-- =============================================================================
-- reviews + certifications — datos del panel del prestador (antes mock/local store)
-- =============================================================================

-- ── Reviews ─────────────────────────────────────────────────────────────────
-- Reseñas de clientes sobre un prestador. Lectura pública (se muestran en el perfil).
-- Escritura server-side (no hay cuentas de cliente en v1): service role.

create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references providers(id) on delete cascade,
  author_name  text not null,
  rating       integer not null check (rating between 1 and 5),
  comment      text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists reviews_provider_idx on reviews (provider_id, created_at desc);

alter table reviews enable row level security;

create policy "reviews_select_all"
  on reviews for select
  using (true);

create policy "reviews_service_write"
  on reviews for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ── Certifications ──────────────────────────────────────────────────────────
-- Documentos de confianza del prestador (DNI, matrícula, etc.). PRIVADAS:
-- sólo el dueño las ve/gestiona. El archivo va al bucket provider-docs.

create table if not exists certifications (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references providers(id) on delete cascade,
  type         text not null check (type in ('dni','matricula','habilitacion','seguro','certificado_curso')),
  file_name    text not null,
  file_path    text,
  status       text not null default 'verified' check (status in ('pending','verified','rejected')),
  points       integer not null default 0 check (points >= 0),
  uploaded_at  timestamptz not null default now(),
  unique (provider_id, type)
);

create index if not exists certifications_provider_idx on certifications (provider_id);

alter table certifications enable row level security;

-- Helper: ¿el provider_id pertenece al usuario autenticado?
-- (se evalúa inline en las policies)

create policy "certifications_select_own"
  on certifications for select
  using (provider_id in (select id from providers where auth_user_id = auth.uid()));

create policy "certifications_insert_own"
  on certifications for insert
  with check (provider_id in (select id from providers where auth_user_id = auth.uid()));

create policy "certifications_update_own"
  on certifications for update
  using (provider_id in (select id from providers where auth_user_id = auth.uid()))
  with check (provider_id in (select id from providers where auth_user_id = auth.uid()));

create policy "certifications_delete_own"
  on certifications for delete
  using (provider_id in (select id from providers where auth_user_id = auth.uid()));
