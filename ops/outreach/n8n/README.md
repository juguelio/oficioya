# Workflows n8n — motor de captación Oficio

Tres workflows importables. En n8n: **Workflows → Import from File** (uno por archivo).

| Archivo | Qué hace | Trigger |
|---------|----------|---------|
| `01-outbound.json` | Lee `prospects` (status=nuevo), manda plantilla 1, registra en `outreach_log`, marca `contactado` | Cron L-V 11hs |
| `02-inbound.json` | Webhook de WhatsApp → clasifica con Claude → responde → actualiza `outreach_log` + `prospects` | Webhook |
| `03-followup.json` | Reenvía a quienes tienen follow-up vencido y no convirtieron | Cron L-V 12hs |
| `05-job-notify.json` | Cuando un cliente publica un trabajo, avisa a los prestadores activos del rubro/ciudad | Webhook (desde la app) |
| `06-ingest-places.json` | Ingesta automática: busca prestadores en Google Places (rubros de SMA) → normaliza → upsert a `prospects` | Cron semanal |
| `07-digest.json` | Resumen diario del embudo (vista `funnel_stats`) → lo manda a tu canal de monitoreo | Cron diario |

## 1. Variables de entorno en n8n
Settings → Variables (o variables de entorno del server). Los workflows leen con `{{$env.X}}`:

```
SUPABASE_URL                 = https://<proyecto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY    = <service role key>   # NUNCA la anon
WHATSAPP_API_URL             = https://waba-v2.360dialog.io   # o tu endpoint Cloud API
WHATSAPP_API_KEY             = <api key de WhatsApp Business>
ANTHROPIC_API_KEY            = <api key Anthropic>
ANTHROPIC_MODEL              = claude-3-5-sonnet-latest   # ajustá al modelo de tu cuenta
GOOGLE_PLACES_API_KEY        = <api key Places (New)>     # para 06-ingest-places
```

> `06-ingest-places`: corré primero **manual** (botón Execute) y revisá cuántas filas
> entran a `prospects` antes de dejar el cron. Usa la Places API (New): devuelve el teléfono
> en la misma respuesta (field mask), una sola llamada por rubro. Ajustá la lista de rubros
> en el nodo "Rubros SMA". Para sumar VLA/Bariloche, duplicá el workflow cambiando la ciudad.

> Si tu n8n bloquea `$env` en expresiones (`N8N_BLOCK_ENV_ACCESS_IN_NODE=true`), reemplazá
> cada `{{$env.X}}` por credenciales Header Auth de n8n, o por un nodo *Set* "Config" al inicio.

## 2. Prerrequisitos en Supabase
- Migraciones aplicadas: `..._outreach_log.sql` y `20260619000010_prospects.sql`.
- Cargar los 52 prospectos: pegá `ops/outreach/seed-prospects.sql` en el SQL editor de Supabase
  (idempotente, `on conflict (phone) do nothing`). O importá `ops/crawl/prospectos.csv` vía n8n.
- La conversión (prospecto → registrado) es **automática** vía trigger DB (`..012`) al crear el provider.
- **Validar móvil vs fijo antes de contactar:** marcar fijos como `descartado`. Muchos del directorio son fijos (no WhatsApp).

## 3. Plantillas de WhatsApp a crear y aprobar en Meta
Los flujos usan dos plantillas (categoría Marketing). El texto está en `../templates.md`:
- `oficio_primer_contacto` — 3 variables: {{1}} nombre, {{2}} ciudad, {{3}} rubro.
- `oficio_followup` — 3 variables: {{1}} nombre, {{2}} rubro, {{3}} ciudad.
- `oficio_trabajo_nuevo` — 3 vars de body ({{1}} nombre, {{2}} título, {{3}} ciudad) + botón URL
  dinámico (base `https://oficioya.app/trabajos/`, suffix = job_id). Para el workflow `05`.
- Idioma: `es_AR` (si tu cuenta no lo tiene, usá `es` y cambiá `language.code` en los JSON).

## 4. Conectar el webhook (inbound)
1. Importá `02-inbound.json`, activalo, copiá la **Production URL** del nodo Webhook
   (`.../webhook/oficio-whatsapp-inbound`).
2. Configurá esa URL como webhook de mensajes entrantes en tu proveedor (360dialog / Meta).
3. El nodo Extract está escrito para el payload de **Cloud API / 360dialog**
   (`entry[0].changes[0].value.messages[0]`). Si tu proveedor manda otra forma, ajustá ese Code.

Para `05-job-notify`: importalo, activalo, copiá su Production URL del Webhook
(`.../webhook/oficio-new-job`) y pegala en la env de la app `VITE_N8N_WEBHOOK_NEW_JOB`
(Vercel). La app la dispara sola al publicarse un trabajo (`PostJobPage` → `sendNewJobAlert`).

## 5. Notas de implementación
- El envío de respuesta libre (inbound) sólo es válido dentro de la ventana de 24hs del último
  mensaje del usuario; por eso el **follow-up usa plantilla**, no texto libre.
- `02-inbound` actualiza `outreach_log` filtrando por `provider_phone` (afecta las filas de esa
  conversación). Si querés actualizar sólo la última, agregá un GET del `id` y filtrá por `id`.
- El cierre del embudo (prospecto → registrado) lo puede hacer este inbound (intent=registered)
  o el webhook post-signup que ya existe en `notifications.ts` (`VITE_N8N_WEBHOOK_NEW_PROVIDER`),
  matcheando por teléfono.
- Empezá con `limit` bajo en `01-outbound` (ya está en 25) y subí de a poco para cuidar el
  quality rating de Meta.

## 6. Orden de activación sugerido
1. Cargar `prospects` + validar teléfonos.
2. Crear y aprobar las plantillas en Meta.
3. Importar y probar `02-inbound` (con un mensaje de prueba a tu número).
4. Importar `01-outbound`, correr **una vez en modo manual** con `limit=1` y verificar
   `outreach_log` + el WhatsApp recibido.
5. Activar crons de `01` y `03`.
