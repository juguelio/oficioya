# Conectar WhatsApp Business API — runbook

Esto prende todo el outreach que ya está construido (flujos n8n 01-outbound, 02-inbound,
03-followup, 05-job-notify). Sin esto, los workflows existen pero no envían/reciben nada.

## Decisión: qué proveedor

Los workflows ya están escritos para **360dialog** (usan el header `D360-API-KEY` y el endpoint
`{WHATSAPP_API_URL}/messages`). Dos caminos:

- **360dialog (recomendado, calza con lo construido):** es un BSP (Business Solution Provider)
  que simplifica el alta de WhatsApp Business Platform. Onboarding más rápido, soporte, y los
  flujos andan tal cual. Tiene costo mensual + por conversación.
- **Meta Cloud API (directo, más barato):** gratis hasta cierto volumen, pero el auth y el
  endpoint son distintos (Bearer token + `graph.facebook.com/v17.0/{phone_id}/messages`). Si vas
  por acá, hay que ajustar los nodos "WhatsApp ·" de los 3 workflows (header y URL). Te lo ajusto
  cuando decidas.

> Recomendación: arrancá con 360dialog para no tocar nada; migrás a Cloud API directo si el costo
> escala. Decidí esto primero.

## Pasos (360dialog)

1. **Meta Business** (prerequisito): tené/creá un Meta Business Account (business.facebook.com).
   Vas a necesitar verificar el negocio (documentación de Oficio / monotributo o equivalente).
2. **Número de teléfono dedicado** para el WhatsApp del negocio. NO uses tu WhatsApp personal.
   Tiene que ser un número que NO esté registrado en la app de WhatsApp normal (o darlo de baja ahí).
3. **Alta en 360dialog** (hub.360dialog.com): creá la cuenta, conectá tu WABA (WhatsApp Business
   Account) de Meta, registrá el número. 360dialog te da una **API key** y la **base URL**.
4. **Cargá en n8n** (env del contenedor, server descanso):
   ```
   WHATSAPP_API_URL = https://waba-v2.360dialog.io   (o la que te dé 360dialog)
   WHATSAPP_API_KEY = <tu D360 API key>
   ```
   Recreá n8n (`docker compose up -d n8n`) para que tome el env.
5. **Plantillas** (Meta las tiene que aprobar — 24-48hs): creá y mandá a aprobar las 3 de
   `ops/outreach/templates.md`, con estos nombres EXACTOS (los workflows los usan):
   - `oficio_primer_contacto` — 3 vars body (nombre, ciudad, rubro). Categoría Marketing.
   - `oficio_followup` — 3 vars body (nombre, rubro, ciudad). Categoría Marketing.
   - `oficio_trabajo_nuevo` — 3 vars body (nombre, título, ciudad) + botón URL dinámico
     (base `https://oficioya.app/trabajos/`, suffix = job_id). Categoría Utility.
   - Idioma `es_AR` (si tu WABA no lo tiene, usá `es` y cambiá `language.code` en los JSON).
6. **Webhook de inbound** (para el flujo 02, respuestas entrantes): en 360dialog configurá la
   URL de inbound apuntando a `https://api.descanso.app/webhook/oficio-whatsapp-inbound`
   (registrá ese workflow en n8n por API/UI igual que el 05).
7. **Importá + activá** los workflows 01/02/03 en n8n (el 05 ya está). Probá:
   - 02-inbound: mandá un WhatsApp de prueba a tu número → debería clasificar y responder.
   - 01-outbound: corré manual con `limit=1` → debería mandar la plantilla 1 a un prospecto.

## Warm-up y compliance (NO saltear)

- **Empezá a bajo volumen** (20-30/día) y subí gradual. Meta da "messaging tiers" que crecen con
  buen comportamiento. Disparar a cientos el día 1 = número restringido/baneado.
- **Quality rating:** si muchos marcan spam/bloquean, Meta te baja el tier. Por eso la lista de
  calidad (matriculados, multi-fuente) importa: contactá primero a los más probables de responder bien.
- **Opt-out (BAJA):** el flujo 02 ya lo respeta (marca `descartado`). Nunca recontactar a un opt-out.
- **Sólo plantillas aprobadas** para iniciar conversación. Respuestas libres sólo dentro de la
  ventana de 24hs (por eso los follow-ups usan plantilla).

## Orden de encendido sugerido

1. Decidir proveedor (360dialog vs Cloud API).
2. Alta + número + API key + envs en n8n.
3. Crear y aprobar las 3 plantillas.
4. Registrar webhook inbound + activar 02.
5. Probar 02 (responder) y 01 (enviar) a bajo volumen.
6. Activar crons de 01/03. Monitorear quality rating + el digest (workflow 07).

Cuando esté, el embudo corre solo: prospects (priorizados por source_count) → 01 manda plantilla →
02 clasifica respuesta con Claude y responde → onboarding por agente → providers. Vos mirás el digest.
