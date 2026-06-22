-- Fix de seguridad #4: el aviso de "trabajo nuevo" se dispara SERVER-SIDE (no desde
-- el browser). El cliente exponía VITE_N8N_WEBHOOK_NEW_JOB en el bundle (spam/abuse).
-- Ahora un trigger en jobs llama al webhook de n8n vía pg_net con un header secreto
-- guardado en Vault. Exception-safe: un fallo de notificación NUNCA bloquea el alta.

create schema if not exists private;

create or replace function private.notify_new_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  begin
    select decrypted_secret into v_secret
      from vault.decrypted_secrets
     where name = 'internal_webhook_secret';

    perform net.http_post(
      url     := 'https://api.descanso.app/webhook/oficio-new-job',
      headers := jsonb_build_object(
                   'Content-Type',    'application/json',
                   'X-Internal-Secret', coalesce(v_secret, '')
                 ),
      body    := jsonb_build_object(
                   'job_id',    new.id,
                   'title',     new.title,
                   'rubro',     new.rubro_id,
                   'ciudad',    new.ciudad_id,
                   'timestamp', now()
                 )
    );
  exception when others then
    raise warning 'notify_new_job: aviso no enviado (%): %', sqlstate, sqlerrm;
  end;
  return new;
end;
$$;

-- Sólo el rol postgres/owner ejecuta esta función (no anon/authenticated).
revoke all on function private.notify_new_job() from public;

drop trigger if exists trg_notify_new_job on jobs;
create trigger trg_notify_new_job
  after insert on jobs
  for each row
  when (new.status = 'open')
  execute function private.notify_new_job();
