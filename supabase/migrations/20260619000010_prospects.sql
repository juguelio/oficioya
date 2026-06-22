-- =============================================================================
-- prospects — cola de captación (outreach queue)
-- Prestadores potenciales levantados por el crawl (ops/crawl/prospectos.csv).
-- SEPARADA de `providers`: un prospecto NO es un prestador hasta que se da de
-- alta por el onboarding (que crea la fila de providers vía trigger de auth).
-- Cuando convierte, se linkea con linked_provider_id.
-- =============================================================================

create table if not exists prospects (
  id                  uuid primary key default gen_random_uuid(),

  -- Datos crudos del directorio (sin constraints de taxonomía: la fuente es ruidosa)
  name                text not null,
  phone               text not null,        -- formato E.164 (+549...)
  rubro               text,                 -- rubro_id tentativo (electricista/gasista/...)
  ciudad              text,                 -- ciudad_id tentativo (san-martin/...)
  source              text not null default 'poraca.com.ar',
  rating_externo      numeric(3,1),         -- rating de Google/directorio (referencia, NO el rating de Oficio)
  reviews_externo     integer,
  address             text,
  notas               text,                 -- flags del crawl (area sospechosa, multi-rubro, 24hs, ...)

  -- Estado de captación
  status              text not null default 'nuevo'
                          check (status in ('nuevo', 'contactado', 'interesado', 'registrado', 'descartado')),

  -- Link a la fila de providers cuando convierte
  linked_provider_id  uuid references providers(id) on delete set null,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Teléfono único: evita duplicar el mismo prospecto entre rubros/fuentes
create unique index if not exists prospects_phone_uniq on prospects (phone);

-- Cola de trabajo: "próximos a contactar"
create index if not exists prospects_status_idx on prospects (status, ciudad, rubro);

-- Auto-update updated_at (reusa el patrón del schema)
create trigger prospects_updated_at
  before update on prospects
  for each row execute function set_updated_at();

-- RLS: solo service role (n8n). Sin acceso desde el browser.
alter table prospects enable row level security;

create policy "prospects_service_role_all"
  on prospects
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
