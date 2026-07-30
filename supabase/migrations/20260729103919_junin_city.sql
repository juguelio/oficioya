-- =============================================================================
-- Junín de los Andes entra al radio operativo v1 (decisión de producto 2026-07-27:
-- la unidad de validación es el radio SMA + Junín, <40 km aprox.).
--
-- Sin esta fila pasan dos cosas, las dos silenciosas:
--   1) build_claimable_profiles() hace `join cities c on c.id = p.ciudad`, así que
--      descarta TODO prospect con ciudad='junin' sin avisar. Hoy son 58 (Google
--      Places, corrida 2026-07-28) que quedaron ingestados y sin poder convertirse.
--   2) providers.ciudad_id es `references cities(id)`: sin la fila, ningún provider
--      de Junín puede existir aunque se lo inserte a mano.
--
-- phone_prefix: Junín comparte el 2972 con San Martín (verificado contra el registro
-- de Camuzzi y el teléfono público de la Cámara de Comercio local).
-- =============================================================================

insert into cities (id, label, phone_prefix, lat, lng) values
  ('junin', 'Junín de los Andes', '+5492972', -39.9497, -71.0678)
on conflict (id) do nothing;
