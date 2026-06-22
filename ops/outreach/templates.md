# Plantillas de outreach — captación de prestadores

Regla madre: **NADA de blast desde WhatsApp app/Business app.** Esto está pensado para
**WhatsApp Business Platform** (Cloud API / 360dialog / Twilio), donde el primer mensaje
sale de una **plantilla aprobada por Meta** (categoría Marketing/Utility), con identificación
del remitente y opción de baja. Volumen bajo y personalizado. Ley 25.326 (AR): base legítima
+ opt-out claro.

Variables: `{{1}}` nombre, `{{2}}` ciudad (label), `{{3}}` rubro (label, ej "electricista").

---

## 1. Primer contacto (plantilla aprobable — categoría Marketing)

> Hola {{1}}, te escribo de **Oficio** 👋 Somos una nueva plataforma para que vecinos de
> {{2}} encuentren {{3}} de confianza. Aparecer es **gratis** y los clientes te contactan
> directo por WhatsApp, sin intermediarios.
>
> ¿Te interesa que te cuente cómo sumarte? Respondé *SÍ* y te paso el link.
>
> _Si no querés recibir más mensajes, respondé BAJA._

Notas de aprobación Meta:
- Identifica al remitente (Oficio), da valor claro, opt-out explícito → pasa revisión.
- Una sola plantilla con variables; no mandar imágenes ni links en el primer toque (mejora
  el quality rating y evita el filtro de spam).

## 2. Si responde SÍ / interesado → hand-off al onboarding por agente

> ¡Genial, {{1}}! 🙌 El alta la hacés en 2 minutos con nuestro asistente, te va guiando paso
> a paso:
>
> 👉 https://oficioya.app/registro/prestador
>
> Cualquier duda me escribís por acá. ¿Te tiro las 3 ventajas rápidas de estar en Oficio?

(El link abre el **onboarding conversacional** que ya está en la app — WhatsApp sólo
"calienta" y entrega. Más adelante se puede hacer el alta 100% nativa por WhatsApp.)

## 3. Si pregunta precio (price_question)

> Buena pregunta. Para el cliente Oficio es gratis. Vos elegís plan:
> • Básico $20.000/mes — 8 contactos
> • Profesional $35.000/mes — contactos ilimitados + insignia ✓ verificado
> • Destacado $55.000/mes — ilimitados + aparecés primero
>
> Podés arrancar y ver cómo te va. ¿Te paso el link para registrarte?

(Precios sincronizados con `subscription_tiers` y `/planes`. Revisar cada 3 meses por inflación.)

## 4. Si dice "ahora no" (not_now) → follow-up educado, sin insistir

> Sin drama, {{1}} 🙌 Te dejo el link por si más adelante querés sumarte:
> https://oficioya.app/registro/prestador
> Te escribo en un par de semanas para ver si pinta. ¡Que andes bien!

## 5. Follow-up único (sin respuesta) — a las 72hs, y NO insistir más

> Hola {{1}}, te había escrito de Oficio por si querías aparecer como {{3}} en {{2}}.
> Si te interesa, el alta es gratis acá: https://oficioya.app/registro/prestador
> Si no, ningún problema — no te escribo más. ¡Saludos!

## 6. Si objeta / desconfía (objection)

> Te entiendo, {{1}}. Oficio es gratis para aparecer y vos manejás tu agenda y tus precios;
> nosotros sólo te acercamos clientes de {{2}}. Si querés, mirá la plataforma sin compromiso:
> https://oficioya.app — y si no es para vos, todo bien.

## 7. Si avisa que se registró (registered) → cierre + verificación

> ¡Genial, {{1}}! Ya quedaste en el sistema 🎉 El último paso es la verificación (DNI/matrícula)
> para que te aparezca la insignia ✓ y los clientes te elijan con más confianza. Avisame si
> necesitás una mano.

## 8. Notificación de trabajo nuevo (a prestadores) — plantilla `oficio_trabajo_nuevo`

Se manda a los prestadores ACTIVOS del rubro/ciudad cuando un cliente publica un trabajo
(workflow `n8n/05-job-notify`). Plantilla Utility con 3 variables de body + botón URL dinámico.

> 🔔 {{1}}, hay un trabajo nuevo de {{2}} en {{3}}. Si te interesa, mandá tu presupuesto:
>
> [Ver trabajo] → botón URL: `https://oficioya.app/trabajos/{{1}}` (suffix dinámico = job_id)

Variables body: {{1}} nombre del prestador, {{2}} título del trabajo, {{3}} ciudad.
Botón: URL dinámica, base `https://oficioya.app/trabajos/`, suffix = `job_id`.

---

## Reglas de cadencia (para el scheduler)

| Estado de la respuesta | Acción | Cuándo |
|------------------------|--------|--------|
| Sin respuesta | 1 follow-up (plantilla 5) | +72hs |
| Sin respuesta tras follow-up | parar | — |
| `not_now` | re-contacto suave (plantilla 4 → luego 5) | +14 días, 1 vez |
| `price_question` | responder (plantilla 3) | inmediato |
| `interested` | hand-off (plantilla 2) | inmediato |
| `objection` | responder (plantilla 6) una vez | inmediato |
| `registered` | cierre (plantilla 7) + marcar `converted` | inmediato |
| `BAJA` / opt-out | `status='descartado'`, no contactar nunca más | inmediato |

Tope de volumen sugerido al arrancar: **20–30 contactos/día** por número, para cuidar el
quality rating de Meta y poder responder a mano lo que el bot no cubra.
