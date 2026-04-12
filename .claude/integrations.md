# Oficio — n8n Integration Reference

All three flows run in n8n. Services involved:

| Service | Host | Port | Notes |
|---------|------|------|-------|
| Baileys WhatsApp bridge | VPS `127.0.0.1` | `3100` | `~/services/whatsapp-baileys/` |
| Whisper transcription API | VPS `127.0.0.1` | `9000` | `~/services/whisper-api/` |
| Supabase REST API | Supabase cloud | 443 | `$env.SUPABASE_URL/rest/v1/` |
| Claude API | Anthropic | 443 | `https://api.anthropic.com/v1/messages` |
| MercadoPago API | MercadoPago | 443 | `https://api.mercadopago.com/v1/` |

n8n env vars required across all flows:
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
BAILEYS_URL=http://127.0.0.1:3100
WHISPER_URL=http://127.0.0.1:9000
ANTHROPIC_API_KEY
MP_ACCESS_TOKEN
APP_URL
```

---

## Flow 1 — Provider Outreach

**File:** `n8n/provider-outreach.workflow.json` _(to be created)_
**Trigger:** Manual or scheduled (e.g. weekdays 10:00 ART)
**Purpose:** Contact providers who have never been reached out to, with a personalized WhatsApp message based on their rubro.

### Node sequence

```
[Trigger]
  → [Supabase: Get uncontacted providers]
  → [SplitInBatches: batchSize=1]
    → [Code: Build personalized message]
    → [Baileys: POST /send]
    → [Supabase: Insert outreach_log row]
  → [Done]
```

### Node specs

**Supabase: Get uncontacted providers**
```
GET $SUPABASE_URL/rest/v1/providers
Headers: apikey, Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY
Query:
  select=id,name,phone,whatsapp_number,rubro_id,ciudad_id,subscription_tier_id
  status=eq.active
  id=not.in.(
    select provider_id from outreach_log where provider_id is not null
  )
```
> Use the `not.in` PostgREST filter or a Supabase RPC if the subquery is unsupported — see note below.

**Code: Build personalized message**

Returns `{ phone, message }`. Message template per rubro:

```js
const templates = {
  electricista:     'Hola {name}, soy de Oficio — la app de oficios en {ciudad}. ¿Te interesaría aparecer gratis este mes para clientes que buscan electricistas?',
  plomero:          'Hola {name}, soy de Oficio — la app de oficios en {ciudad}. ¿Querés que los clientes que buscan plomeros te encuentren a vos primero?',
  // ... one per rubro; fallback below
  _default:         'Hola {name}, soy de Oficio — la app de oficios en {ciudad}. ¿Te interesaría aparecer gratis en nuestra plataforma este mes?',
}
const tpl = templates[rubro_id] ?? templates._default
return tpl.replace('{name}', firstName).replace('{ciudad}', ciudadLabel)
```

`firstName` = first word of `name`. `ciudadLabel` = human label from tokens (san-martin → "San Martín de los Andes", etc.).

**Baileys: POST /send**
```
POST $BAILEYS_URL/send
Body: { "phone": "{{ $json.phone }}", "message": "{{ $json.message }}" }
```

**Supabase: Insert outreach_log row**
```
POST $SUPABASE_URL/rest/v1/outreach_log
Headers: Prefer: return=minimal
Body: {
  "provider_id":    "{{ provider.id }}",
  "provider_phone": "{{ provider.whatsapp_number ?? provider.phone }}",
  "message_sent":   "{{ $json.message }}",
  "sent_at":        "{{ $now }}"
}
```

### Note on "uncontacted" query

PostgREST doesn't support subqueries directly. Two options:

1. **Supabase RPC** (recommended): create `get_uncontacted_providers()` function that does the `NOT IN` join server-side.
2. **Two-step in n8n**: first fetch all `outreach_log.provider_id` values, then filter in a Code node before the loop.

---

## Flow 2 — Incoming Message Handler

**File:** `n8n/incoming-message-handler.workflow.json` _(to be created)_
**Trigger:** Webhook — Baileys POSTs here on every incoming message
**Webhook path:** `whatsapp-incoming` (same URL set in Baileys `.env` as `N8N_INCOMING_WEBHOOK_URL`)
**Purpose:** Classify provider responses, generate a suggested reply via Claude, log intent, and send the reply.

### Node sequence

```
[Webhook: Incoming message]
  → [Respond 200 immediately]          ← parallel branch, keeps Baileys happy
  → [IF: has audio_path?]
      YES → [Whisper: POST /transcribe]
              → [Set: text = transcription.text]
      NO  → [Set: text = $json.text]
  → [Supabase: Find open outreach_log for phone]
  → [IF: outreach_log found?]
      NO  → [NoOp: unknown sender]
      YES → [HTTP: Claude classify + suggest reply]
              → [Supabase: Update outreach_log with intent]
              → [Baileys: POST /send with suggested_reply]
              → [Supabase: Update outreach_log replied_at]
```

### Node specs

**IF: has audio_path?**
```
Condition: $json.audio_local_path  is not empty
```

**Whisper: POST /transcribe**
```
POST $WHISPER_URL/transcribe
Body: { "audio_path": "{{ $json.audio_local_path }}" }
```
Response: `{ text, language, duration }`

**Supabase: Find open outreach_log for phone**
```
GET $SUPABASE_URL/rest/v1/outreach_log
Query:
  provider_phone=eq.{{ $json.from_phone }}
  converted=eq.false
  order=sent_at.desc
  limit=1
```

**HTTP: Claude classify + suggest reply**
```
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: $ANTHROPIC_API_KEY
  anthropic-version: 2023-06-01
  Content-Type: application/json
Body:
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 300,
  "system": "Sos un asistente de ventas para Oficio, un marketplace de oficios en la Patagonia argentina. Analizá la respuesta del prestador y devolvé JSON con dos campos: 'intent' (uno de: interested / not_now / price_question / registered / objection / unclassified) y 'suggested_reply' (mensaje de WhatsApp en español rioplatense, máximo 2 oraciones, tono humano y directo, sin emojis excesivos). Solo JSON, sin texto adicional.",
  "messages": [
    {
      "role": "user",
      "content": "Contexto del prestador:\n- Nombre: {{ outreach_log.provider_name }}\n- Rubro: {{ outreach_log.rubro_id }}\n- Ciudad: {{ outreach_log.ciudad_id }}\n- Mensaje que le enviamos: {{ outreach_log.message_sent }}\n\nRespuesta del prestador:\n{{ text }}"
    }
  ]
}
```

Parse `content[0].text` as JSON to extract `intent` and `suggested_reply`.

**Supabase: Update outreach_log with intent**
```
PATCH $SUPABASE_URL/rest/v1/outreach_log?id=eq.{{ outreach_log.id }}
Body: {
  "response_text": "{{ text }}",
  "response_at":   "{{ $now }}",
  "intent":        "{{ $json.intent }}",
  "suggested_reply": "{{ $json.suggested_reply }}"
}
```

**Baileys: POST /send with suggested_reply**
```
POST $BAILEYS_URL/send
Body: {
  "phone":   "{{ outreach_log.provider_phone }}",
  "message": "{{ $json.suggested_reply }}"
}
```

### Intent → follow-up scheduling

After logging the intent, add a branch:

| Intent | Action |
|--------|--------|
| `interested` | Set `follow_up_scheduled_at = now() + 24h`, mark for human review |
| `not_now` | Set `follow_up_scheduled_at = now() + 7d` |
| `price_question` | Claude reply handles it; no follow-up |
| `registered` | Set `converted = true`, `converted_at = now()` |
| `objection` | Set `follow_up_scheduled_at = now() + 14d` |
| `unclassified` | Flag for manual review (no auto follow-up) |

---

## Flow 3 — Emergency Heartbeat (WhatsApp Response Router)

**File:** `n8n/whatsapp-response-router.workflow.json`
**Status:** Already built and documented — see `n8n/whatsapp-response-router.workflow.json`
**Trigger:** Webhook — same `whatsapp-incoming` endpoint as Flow 2

> **Note:** Flows 2 and 3 share the same incoming webhook from Baileys. They need to be merged into one router workflow, or Baileys must POST to two separate n8n webhooks. The recommended approach is a single entry webhook with a routing branch:

### Combined entry router

```
[Webhook: Incoming message]
  → [Respond 200 immediately]
  → [Code: Extract phone + text]
  → [IF: Emergency — does phone match an open emergency_request?]
      YES → [Flow 3 sub-path: resume emergency execution]
      NO  → [IF: Outreach — does phone match an open outreach_log?]
                YES → [Flow 2 sub-path: classify + reply]
                NO  → [NoOp: unknown sender]
```

The emergency check (`find_emergency_request_by_provider_phone` RPC) runs first because it is time-critical. Outreach classification happens only if no emergency is active for that number.

### Flow 3 sub-path nodes

**Supabase RPC: find_emergency_request_by_provider_phone**
```
POST $SUPABASE_URL/rest/v1/rpc/find_emergency_request_by_provider_phone
Body: { "p_phone": "{{ $json.fromPhone }}" }
```
Returns `{ id, n8n_resume_url, status, ... }` or empty array.

**IF: Response is SI?**
```
Condition: $json.text.trim().toUpperCase() matches /^SI\b/
```
(Accept "Sí", "si", "SI", "Sí!" — normalize before compare)

**HTTP: Resume n8n execution**
```
POST {{ $json.n8n_resume_url }}
Body: { "response": "{{ normalized_response }}" }
```
This wakes the paused emergency-matching workflow at its Wait node.

**Supabase: Update emergency_request status → matched**
_(done inside the emergency-matching workflow after resume, not here)_

---

## Supabase Tables Referenced

| Table | Used by |
|-------|---------|
| `providers` | All flows |
| `emergency_requests` | Flow 3, `mp-payment-confirmed` |
| `outreach_log` | Flows 1 + 2 |

### outreach_log schema

```sql
-- see: supabase/migrations/20260404000005_outreach_log.sql
id                     uuid PK
provider_id            uuid → providers.id
provider_phone         text  (indexed)
message_sent           text
sent_at                timestamptz
response_text          text
response_at            timestamptz
audio_local_path       text
intent                 text  (enum: interested / not_now / price_question /
                               registered / objection / unclassified)
suggested_reply        text
replied_at             timestamptz
follow_up_scheduled_at timestamptz  (indexed, nulls excluded)
converted              boolean default false
converted_at           timestamptz
created_at / updated_at timestamptz (auto)
```

RLS: service role only. n8n always uses `SUPABASE_SERVICE_ROLE_KEY`.

---

## Audio path handoff (Baileys → n8n → Whisper)

```
Baileys saves incoming voice note to ./tmp/audio_1234567890.ogg
  ↓
Baileys POSTs to n8n webhook:
  { from_phone, message_type: "audio", audio_local_path: "/abs/path/audio_1234.ogg" }
  ↓
n8n Flow 2: POSTs audio_local_path to Whisper /transcribe
  ↓
Whisper reads file directly from disk (same VPS), returns { text, language, duration }
  ↓
n8n continues with text as if it were a plain message
```

Baileys and Whisper must run on the same VPS for the local path to be valid. If deployed separately, replace `audio_local_path` with a URL and have Whisper download it.
