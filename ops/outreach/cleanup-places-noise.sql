-- Limpieza del ruido geográfico de la primera corrida de Places (workflow 06 v1).
-- Borra prospectos source='google_places' que NO son de San Martín de los Andes, Neuquén
-- (otros "San Martín" de Mendoza/BsAs, o teléfonos no argentinos tipo +56 Chile).
-- El 06 v2 ya filtra esto en la ingesta; esto limpia lo que entró antes.

-- 1) Ver qué se borraría (corré esto primero):
-- select name, phone, address from prospects
--  where source='google_places'
--    and ( phone not like '+54%'
--          or ( (address is null) or (address not ilike '%neuqu%' and address not like '%8370%') ) );

-- 2) Borrar:
delete from prospects
 where source = 'google_places'
   and ( phone not like '+54%'
         or ( (address is null) or (address not ilike '%neuqu%' and address not like '%8370%') ) );
