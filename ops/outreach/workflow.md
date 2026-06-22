# Motor de captación automatizado — diseño n8n

> **Workflows importables listos en `ops/outreach/n8n/`** (01-outbound, 02-inbound, 03-followup
> + README de setup). Este archivo es el diseño/razón de cada flujo; los JSON son la implementación.

Une: `prospects` (cola) + `outreach_log` (registro por teléfono) + WhatsApp Business API +
Claude (clasificación) + el onboarding conversacional de la app. Todo el server-side corre
con `SUPABASE_SERVICE_ROLE_KEY` (nunca en el browser).

## Variables de entorno (ya en `.env.example`)
```
WHATSAPP_API_URL, WHATSAPP_API_KEY   # 360dialog / Cloud API / Twilio
N8N_BASE_URL, APP_URL                # APP_URL = https://oficioya.app
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY                    # agregar: para el nodo de clasificación
```

## Paso 0 — Ingesta de prospectos (una vez por crawl)
`ops/crawl/prospectos.csv` → upsert a `prospects` (por `phone`, único).
- n8n: nodo *Read Binary File / HTTP* del CSV → *Spreadsheet File* → *Supabase: upsert* en `prospects`.
- O `psql \copy`. Status inicial `nuevo`.
- Antes de mandar nada: **validar móvil vs fijo** (muchos del directorio son fijos). Marcar
  los fijos como `descartado` o moverlos a un canal de llamada, no de WhatsApp.

## Flujo A — Outbound (scheduled, ej. 1×/día, lunes a viernes 10–18h)
```
Cron
 → Supabase: select de `prospects` where status='nuevo' limit 20–30  (cuidar quality rating)
 → loop:
     → WhatsApp API: enviar PLANTILLA 1 (aprobada) con {{name}},{{ciudad}},{{rubro}}
     → Supabase insert `outreach_log`: { provider_phone, message_sent, sent_at }
     → Supabase update `prospects`: status='contactado'
```

## Flujo B — Inbound (webhook de WhatsApp, tiempo real)
```
Webhook (mensaje entrante)
 → Supabase: buscar última `outreach_log` por provider_phone (índice ya existe)
 → setear response_text, response_at  (si es audio: audio_local_path + transcribir)
 → Nodo Claude: classification-prompt.md  → { intent, suggested_reply }
 → Supabase update `outreach_log`: intent, suggested_reply
 → switch por intent:
     interested / price_question / objection / not_now
         → WhatsApp API: enviar suggested_reply  (o dejar para revisión humana si confianza baja)
         → outreach_log.replied_at = now()
         → si interested → además enviar PLANTILLA 2 con link {APP_URL}/registro/prestador
     registered
         → outreach_log: converted=true, converted_at=now()
         → prospects: status='registrado'
     opt-out (BAJA)
         → prospects: status='descartado'   (no volver a contactar nunca)
 → si intent in (not_now) → outreach_log.follow_up_scheduled_at = now()+14d
 → si sin acción → follow_up_scheduled_at = now()+72h (1 solo follow-up)
```

## Flujo C — Follow-ups (scheduled, 1×/día)
```
Cron
 → Supabase select `outreach_log` where follow_up_scheduled_at <= now()
       and converted=false  (índice parcial ya existe)
 → enviar PLANTILLA 4/5 según corresponda
 → limpiar follow_up_scheduled_at (no reprogramar: 1 follow-up y basta)
```

## Cierre del loop — conversión real (AUTOMÁTICO, sin n8n)
Cuando el prospecto completa el onboarding (`/registro/prestador`):
- El trigger de auth crea la fila en `providers`.
- El trigger `on_provider_link_prospect` (migración `..012`) matchea por los últimos 8 dígitos
  del teléfono y setea automáticamente `prospects.status='registrado'`,
  `prospects.linked_provider_id` y `outreach_log.converted=true`.
- No hace falta webhook ni n8n para esto: es atómico en la DB. El embudo queda medible:
  nuevo → contactado → interesado → registrado.
- (El inbound `02` también marca `registrado` si el prestador *avisa* por WhatsApp que se
  registró; el trigger es la fuente de verdad al crearse el provider.)

## Métricas del embudo (una query)
```sql
select status, count(*) from prospects group by status;
select intent, count(*) from outreach_log group by intent;
select count(*) filter (where converted) as convertidos,
       count(*) as contactados,
       round(100.0*count(*) filter (where converted)/nullif(count(*),0),1) as tasa_pct
from outreach_log;
```

## Cumplimiento (no negociable)
- Sólo WhatsApp Business Platform con plantillas aprobadas. Nada de blast desde la app.
- Opt-out (BAJA) respetado siempre y para siempre.
- Volumen bajo y creciente; responder a mano lo que el bot no cubre.
- Base legítima de contacto (datos públicos de directorio) + finalidad informada (Ley 25.326).
