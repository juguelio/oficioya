-- =============================================================================
-- funnel_stats — vista de monitoreo del embudo (para el digest diario)
-- Una sola fila con los números clave. La lee n8n con service role.
-- =============================================================================

create or replace view funnel_stats as
select
  (select count(*) from prospects)                                   as prospectos_total,
  (select count(*) from prospects where status = 'nuevo')            as nuevos,
  (select count(*) from prospects where status = 'contactado')       as contactados,
  (select count(*) from prospects where status = 'interesado')       as interesados,
  (select count(*) from prospects where status = 'registrado')       as registrados,
  (select count(*) from providers where status = 'active')           as prestadores_activos,
  (select count(*) from outreach_log)                                as outreach_total,
  (select count(*) from outreach_log where converted)                as conversiones,
  (select count(*) from jobs  where created_at > now() - interval '7 days') as trabajos_7d,
  (select count(*) from quotes where created_at > now() - interval '7 days') as presupuestos_7d;

grant select on funnel_stats to anon, authenticated;
