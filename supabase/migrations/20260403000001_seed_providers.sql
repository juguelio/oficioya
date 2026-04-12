-- =============================================================================
-- Seed: 10 initial providers (migrated from mock-providers.ts)
-- auth_user_id is null — will be linked when each provider claims their listing
-- =============================================================================

insert into providers (
  name, phone, whatsapp_number, ciudad_id, rubro_id, subscription_tier_id,
  barrio, bio, rating, total_jobs, is_verified, is_emergency_available,
  status, photos, lat, lng, created_at
) values

  -- Bariloche
  ('Héctor Antiñir',  '+5492944513870', '+5492944513870', 'bariloche', 'electricista', 'destacado',
   'Melipal',
   'Electricista matriculado con 14 años en el Valle. Me especializo en tableros y domótica residencial.',
   4.9, 184, true, false, 'active', '{}', -41.1290, -71.3185, '2023-02-15'),

  ('Mirta Quintana',  '+5492944672341', '+5492944672341', 'bariloche', 'pintor', 'profesional',
   'Playa Bonita',
   'Ocho años pintando interiores y exteriores en Bariloche. Trabajo prolijo, puntual y con garantía.',
   4.8, 112, true, false, 'active', '{}', -41.1210, -71.3450, '2023-07-20'),

  ('Jorge Mansilla',  '+5492944789012', '+5492944789012', 'bariloche', 'plomero', 'basico',
   'Belgrano',
   'Plomero con cuatro años en la zona. Arreglos de urgencia y colocación de artefactos.',
   4.3, 58, false, false, 'active', '{}', -41.1380, -71.3050, '2024-01-10'),

  ('Rosa Antiñir',    '+5492944312678', '+5492944312678', 'bariloche', 'limpieza', 'profesional',
   'Km 8',
   'Limpieza de casas, cabañas y apartamentos turísticos. Trabajo con productos ecológicos y garantía de resultado.',
   4.7, 93, true, false, 'active', '{}', -41.1440, -71.3920, '2023-10-18'),

  -- San Martín de los Andes
  ('Pablo Pereyra',   '+5492972415230', '+5492972415230', 'san-martin', 'carpintero', 'profesional',
   'Centro',
   'Carpintero de obra y muebles a medida. Trabajo en madera nativa y machimbre patagónico hace 11 años.',
   4.9, 203, true, false, 'active', '{}', -40.1530, -71.3480, '2022-11-05'),

  ('Nora Lagos',      '+5492972523890', '+5492972523890', 'san-martin', 'jardinero', 'profesional',
   'Arrayanes',
   'Paisajista con enfoque en flora nativa patagónica. Diseño, mantenimiento y podas de temporada.',
   4.6, 87, true, false, 'active', '{}', -40.1610, -71.3560, '2023-09-01'),

  ('Rodolfo Orellano','+5492972601477', '+5492972601477', 'san-martin', 'gasista', 'basico',
   'Chapelco',
   'Gasista matriculado MP 2187. Instalaciones de calefacción y revisión de termotanques.',
   4.4, 34, false, false, 'active', '{}', -40.1490, -71.3410, '2024-06-15'),

  ('Héctor Mansilla', '+5492972489034', '+5492972489034', 'san-martin', 'flete', 'profesional',
   'Marinas',
   'Flete y mudanzas en todo el corredor andino: San Martín, VLA y Bariloche. Camión con rampa y fajado incluido.',
   4.5, 67, true, false, 'active', '{}', -40.1600, -71.3530, '2024-03-05'),

  -- Villa La Angostura
  ('Claudia Nahuel',  '+5492972710984', '+5492972710984', 'villa-la-angostura', 'calefaccionista', 'profesional',
   'Puerto Manzano',
   'Especialista en calderas y estufas a leña. Más de 10 años calentando hogares en la Angostura.',
   4.8, 145, true, false, 'active', '{}', -40.7510, -71.6380, '2023-04-12'),

  ('Gustavo Fuentes', '+5492972834561', '+5492972834561', 'villa-la-angostura', 'albanil', null,
   'El Cruce',
   'Albañil en obras nuevas y remodelaciones. Experiencia en construcción con madera y piedra local.',
   4.2, 21, false, false, 'active', '{}', -40.7650, -71.6540, '2025-01-20');
