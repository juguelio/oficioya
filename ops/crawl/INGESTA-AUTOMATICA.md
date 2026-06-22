# Ingesta automática de prospectos — arquitectura

Objetivo (tu visión): el sistema **descubre prestadores solo**, los valida, los contacta y los
onboardea sin intervención. Vos **monitoreás**. Esta es la capa de ingesta que alimenta el motor
de captación ya construido (`ops/outreach/`). Reusa tu n8n + Supabase.

```
[Fuentes] → ingesta (n8n, scheduled) → normalizar → dedup → validar móvil → score
   → prospects(status=nuevo) → [outreach 01/02/03] → onboarding por agente → providers
                                                          ↑ trigger ..012 cierra el embudo
```

## Las fuentes, por nivel de automatización (de mejor a peor)

### Nivel 1 — APIs oficiales (lo más automatizable y limpio) ✅ recomendado como columna vertebral
- **Google Places API** (Text Search + Place Details). Una query tipo `"plomero en San Martín de
  los Andes"` → lista de lugares; por cada `place_id` un Place Details → **nombre, teléfono
  internacional, rating, reviews, ubicación, sitio web**, estructurado. Cubre TODOS los rubros y
  es la fuente más completa y escalable. Costo por request (tier gratis mensual + billing).
  - Endpoints: `places.googleapis.com/v1/places:searchText` → `places.googleapis.com/v1/places/{id}`.
  - Necesita: **tu API key con billing** + restringirla por IP del server n8n.
- **Meta Graph API** (para descubrir páginas de IG/FB business): requiere app + review de Meta.
  Alto esfuerzo de aprobación; dejarlo para fase 2.

### Nivel 2 — Registros oficiales y directorios estáticos (scrapeables con fetch) ✅ alta calidad local
- **Coop de Agua Potable SMA** (`agua.coop`) — ya integrada: 53 matriculados de plomería/gas.
- **Colegios de matriculados** (electricistas/gasistas de Neuquén) — listas oficiales con matrícula.
- **Municipio de SMA** (plataforma de contratación de servicios) — directorio local.
- **Por Acá** (`poraca.com.ar`) — ya integrada (ruidosa, filtrar autos/comercios).
- **miguiaargentina / guiacores / páginas amarillas** — directorios; algunos esconden el teléfono
  tras interacción (necesitan render con Chrome o las fichas de detalle).
- Estos se automatizan con un nodo HTTP de n8n por fuente + parser. Bajo costo, sin API key.

### Nivel 3 — Instagram / Facebook (NO scrape directo) ⚠️
- Login wall + JS + anti-bot + ToS. No los toques con fetch ni scripts caseros.
- Vía automatizable: **servicio gestionado tipo Apify** (actors de IG/FB/Maps que devuelven JSON)
  con tu token, orquestado desde n8n. Útil para descubrir cuentas locales y su bio/WhatsApp.
- Realidad: para prospectos *locales* de SMA, IG/FB rinden poco vs. Places + registros oficiales.
  Priorizá Nivel 1 y 2; sumá IG/FB sólo si querés cazar a los que sólo existen en redes.

## El pipeline (cómo lo automatizás en n8n)

1. **Ingesta por fuente** (workflows `06-ingest-*`, scheduled, ej. semanal):
   - Places: por cada (rubro × ciudad) → searchText → Place Details → normalizar.
   - Directorios/registros: fetch + parser.
2. **Normalizar** a tu esquema (`name, phone, rubro, ciudad, source, rating, reviews, address, notas`).
3. **Dedup** por teléfono (índice `prospects_phone_uniq` ya existe; comparar por últimos 8 dígitos).
4. **Validar móvil** (lo más importante antes de gastar mensajes): el **check de contactos de la
   WhatsApp Business API** dice si un número está en WhatsApp. Los fijos → marcar/descartar.
5. **Score / prioridad** (para que el outreach ataque primero a los mejores): matrícula (+), rating
   y nº reseñas (+), 24hs/multi-rubro (+ para guardia), móvil verificado (+).
6. **Upsert** a `prospects` (status=nuevo). De ahí lo toman los flujos `01/02/03` ya hechos.

## Lo que vos sólo monitoreás (el panel)
- Una **query/vista de embudo** (`prospects` por status, `outreach_log` por intent, tasa de
  conversión) — ya están las queries en `ops/outreach/workflow.md`.
- Un **digest diario** (n8n → tu WhatsApp/Telegram/Slack): "X nuevos, Y contactados, Z interesados,
  W registrados hoy". Así monitoreás sin entrar a nada.
- Opcional: un artifact de Cowork que lee Supabase y te muestra el embudo en vivo.

## Lo que necesito de vos para encenderlo
1. **Google Places API key** (+ billing) → te genero el workflow `06-ingest-places.json` (mismo
   estilo que los otros) que ingesta por rubro×ciudad y upsertea a `prospects`.
2. (Opcional) **token de Apify** → workflow de IG/FB/Maps gestionado.
3. **WhatsApp Business API** (ya pendiente) → habilita el paso de validación móvil + el outreach.

## Verdad incómoda (para que el sistema no se queme solo)
Por más bueno que sea el crawl, el cuello no es descubrir números: es que el **outreach en frío
está limitado por Meta** (plantilla aprobada + warm-up + quality rating). Un sistema 100% automático
que dispara a miles el día 1 se autobloquea. La automatización correcta arranca a **bajo volumen,
sube gradual, y respeta opt-out** — el sistema escala el ritmo, no lo saltea. Calidad de lista
(matriculados, móviles validados) > cantidad.
