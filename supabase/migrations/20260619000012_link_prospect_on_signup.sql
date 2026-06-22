-- =============================================================================
-- Cierre del embudo de captación.
-- Cuando se crea una fila en `providers` (alta por onboarding), se marca el
-- prospecto correspondiente como `registrado`, se linkea, y se cierra su
-- `outreach_log` (converted=true). Así el embudo nuevo→contactado→registrado
-- queda medible sin intervención de n8n.
--
-- Matching por teléfono: el crawl guarda `+54...` (a veces fijo, sin 9) y el
-- onboarding guarda `+549...` (móvil). Se comparan los últimos 8 dígitos del
-- número de abonado, que es estable entre ambos formatos.
-- =============================================================================

create or replace function link_prospect_on_provider_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tail text := right(regexp_replace(coalesce(new.whatsapp_number, new.phone), '\D', '', 'g'), 8);
begin
  if tail is null or length(tail) < 8 then
    return new;
  end if;

  -- Marcar el prospecto como registrado y linkearlo
  update prospects p
     set status             = 'registrado',
         linked_provider_id = new.id,
         updated_at         = now()
   where p.status <> 'registrado'
     and right(regexp_replace(p.phone, '\D', '', 'g'), 8) = tail;

  -- Cerrar el log de outreach asociado
  update outreach_log o
     set converted    = true,
         converted_at = now(),
         updated_at   = now()
   where o.converted = false
     and right(regexp_replace(o.provider_phone, '\D', '', 'g'), 8) = tail;

  return new;
end;
$$;

create trigger on_provider_link_prospect
  after insert on providers
  for each row
  execute function link_prospect_on_provider_insert();
