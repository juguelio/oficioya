# Crawl de prestadores — pipeline y hallazgos

Objetivo: armar una base de prospectos reales (prestadores de oficios) en San Martín
de los Andes, Villa La Angostura y Bariloche para reemplazar el mock y alimentar el
onboarding. Esto es **generación de leads sobre datos públicos** — la captación se hace
después, de forma compliant (ver §Outreach).

## Estado: multi-fuente, foco San Martín (2026-06-19)

`prospectos.csv` — **105 prospectos reales**. **San Martín de los Andes = 63** (ciudad foco),
Bariloche 35, VLA 7. Por rubro: plomero 53, electricista 22, cerrajero 17, gasista 13.

Dos fuentes:
1. **Por Acá** (poraca.com.ar) — directorio scrape de Google Maps. 52 prospectos (electricista/
   gasista/cerrajero de las 3 ciudades). Ruidoso (ver reglas de limpieza).
2. **Cooperativa de Agua Potable de SMA** (agua.coop/tecnicos-matriculados.html) — **registro
   OFICIAL de 53 plomeros/gasistas matriculados de San Martín**, con nombre, N° de matrícula y
   teléfono. Fuente de oro: local, verificada (matrícula), y tapa el gap de plomeros. 51 con
   celular (WhatsApp), 2 solo fijo (marcados `fijo (no WhatsApp)`). Cargá la matrícula como señal
   de confianza al onboardear.

> Aprendizaje sobre Instagram/Facebook: NO se scrapean directo (login wall + JS + anti-bot + ToS).
> Las búsquedas de IG para SMA devolvieron cuentas de Buenos Aires, no locales. Camino real para
> IG/FB: API oficial (Meta Graph) o servicio gestionado (Apify). Para datos locales de calidad,
> los **registros oficiales** (coop de agua, colegios de matriculados, municipio) rinden mucho más.

## Fuente piloto: Por Acá (poraca.com.ar)

Directorio estático, sin API key, parseable directo del HTML. Patrón de URL predecible:

```
https://poraca.com.ar/{rubro}/{provincia}/{ciudad}/
```

- Ciudades: `neuquen/san-martin-de-los-andes`, `neuquen/villa-la-angostura`, `rio-negro/bariloche`
- Rubros con cobertura: electricistas, plomeros, gasistas, pintores, cerrajeros, albaniles,
  limpieza, calefaccion-central, tecnico-aire-acondicionado, refrigeracion (10 de los 16 de Oficio)
- Por cada ficha se obtiene: nombre, dirección, rating, nº de reseñas, teléfono.

## Reglas de limpieza (OBLIGATORIAS — la fuente es scrape de Google Maps, ruidosa)

Excluir:
- **Electricidad del automotor / del automóvil** → es electricidad de autos, no de hogar.
- **Comercios / retail** (iluminación, LED, "materiales eléctricos", distribuidoras).
- **Cooperativas y utilities** (Cooperativa de Electricidad, Camuzzi, YPF Gas distribuidor).
- **Fichas sin teléfono.**
- **Duplicados** (misma empresa/teléfono repetida; dedupe por teléfono normalizado).

Flags a conservar (no excluyen, pero requieren revisión):
- `area sospechosa`: código de área de otra provincia (379 Corrientes, 280 Madryn, 11 BsAs)
  cuando la ciudad es 294/2972 → puede ser celular de otro lado o dato erróneo de Maps.
- `multi-rubro` / `EMERGENCIA 24hs`: candidatos ideales para modo guardia.

## Hallazgos de cobertura (importante para planear)

| Ciudad | electricistas | gasistas | cerrajeros | plomeros (matric.) |
|--------|---------------|----------|-----------|--------------------|
| **San Martín** | 3 | 2 | 5 | **53** (registro coop agua) |
| Bariloche | 16 | 7 | 12 | 0 (gasistas multi-rubro) |
| Villa La Angostura | 3 | 4 | 0 | 0 |

- **El gap de plomeros en SMA quedó cubierto** con el registro de matriculados de la coop de agua.
  Para Bariloche/VLA sigue siendo gap (Google Places API o registros locales).
- **Teléfonos sin validar:** algunos son fijos (no WhatsApp). El pipeline necesita un paso de
  **validación móvil** (idealmente el check de contacto de la WhatsApp Business API).

## Próximos pasos para escalar (de menor a mayor esfuerzo)

1. Completar Por Acá: faltan VLA (todos los rubros), gasistas SMA, y los otros 7 rubros
   con cobertura. ~30 páginas más de fetch + parseo.
2. **Multi-fuente** para tapar gaps (sobre todo plomeros y rubros que Por Acá no tiene:
   carpintero, jardinero, herrero, techista, tecnico-pc, flete, leñero, cabañas):
   guiacores.com.ar, licuo.com.ar, iglobal, grupos de Facebook locales, registros municipales.
3. **Google Places API (Text Search + Place Details)** — la vía escalable y más limpia para
   cobertura real. Requiere API key con billing del usuario. Devuelve nombre, teléfono,
   ubicación, rating de forma estructurada.
4. **Validación de teléfonos** (móvil vs fijo) antes de cargar a Supabase / outreach.

## Outreach (recordatorio de compliance)

NO hacer blast automático desde WhatsApp app/Business app → baneo + riesgo legal (Ley 25.326).
Vía correcta: WhatsApp Business Platform (Cloud API / 360dialog / Twilio) con plantilla
pre-aprobada + base de opt-in, o primer toque personalizado de bajo volumen. El onboarding
conversacional por agente se dispara cuando el prestador responde/engancha.
