-- =============================================================================
-- 1) Nuevo rubro: electrodomésticos (heladeras, lavarropas, línea blanca)
--    No estaba cubierto por los 16 rubros originales.
-- 2) Perfil de "El Laboratorio" (Matías Frugoni) en San Martín de los Andes.
--    Perfil de DEMO: rating / total_jobs son placeholders realistas, reemplazar
--    por datos reales cuando Matías confirme.
-- =============================================================================

insert into rubros (id, label, icon)
values ('electrodomesticos', 'Electrodomésticos', '🧊')
on conflict (id) do nothing;

insert into providers (
  name, phone, whatsapp_number, ciudad_id, rubro_id, subscription_tier_id,
  barrio, bio, rating, total_jobs, is_verified, is_emergency_available,
  status, photos, lat, lng, created_at
)
select
  'El Laboratorio — Matías Frugoni',
  '+5492995178626',
  '+5492995178626',
  'san-martin',
  'electrodomesticos',
  'destacado',
  'Centro',
  'Reparo heladeras y lavarropas a domicilio, todas las marcas. Diagnóstico en el día y garantía escrita sobre el trabajo.',
  4.9,
  74,
  true,
  false,
  'active',
  '{/images/provider-el-laboratorio.png}',
  -40.1560,
  -71.3495,
  '2025-10-05'
where not exists (
  select 1 from providers where phone = '+5492995178626'
);
