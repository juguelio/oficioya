# Outreach pack — cohorte fundadora SMA + Junín (v0)

**Estado: LISTO, NO ENVIADO.** Nada de esto sale sin OK explícito de Juguelio.

Complementa `templates.md`. Donde difieren, **manda este archivo**: `templates.md` quedó
escrito para el modelo "gratis para aparecer + planes pagos ya visibles", y la decisión
de producto 2026-07-27 es **90 días gratis para la cohorte fundadora, sin cobrar hasta
que haya señal**.

## Diferencias con `templates.md` (leer antes de usar)

| Tema | `templates.md` | Este pack |
|---|---|---|
| Oferta | "aparecer es gratis" + planes pagos en plantilla 3 | 90 días gratis explícitos, plan mensual recién después |
| Follow-up | +72hs | +48hs (una sola vez) |
| Envío | WhatsApp Business Platform, plantilla aprobada Meta | **manual, uno por uno**, sin automatización |
| Alcance | `{{2}}` ciudad | radio SMA + Junín |
| Emergencias/paywall | — | **no mencionar** en este sprint |

## Canal por tipo de candidato

El desk (`provider-desk-v0.csv`) tiene dos orígenes con aperturas distintas.

### A. `provider:<uuid>` — perfil unclaimed ya publicado

Estos ya tienen perfil visible en oficioya.app con su rating de Google y el WhatsApp
oculto. El opener más fuerte es ese: **"ya te armamos el perfil, sólo confirmalo"**.

Para armar el link hace falta el `claim_token`, que sólo se lee con service_role:

```sql
-- correr con service_role, NO con anon
select id, name, claim_token from providers where status = 'unclaimed' and id = '<uuid>';
```

Link resultante: `https://oficioya.app/activar/<id>#t=<claim_token>`

### B. `prospect:<slug>` — fijo de poraca, sin perfil claimable

No tienen WhatsApp conocido (E.164 sin prefijo 9 → quedaron fuera de
`build_claimable_profiles()`). **Primero llamada telefónica**, y recién con el móvil
confirmado se sigue por WhatsApp.

## 1. Opener WhatsApp — perfil unclaimed (canal A)

> Hola {nombre} 👋 Te escribo de **Oficio**, una guía local de oficios verificados para
> San Martín y Junín de los Andes.
>
> Te armamos el perfil con tus datos públicos y ya está publicado — lo único que falta
> es que lo confirmes vos para que la gente te pueda escribir directo por WhatsApp.
>
> Para los primeros prestadores es **gratis 90 días**: perfil, verificación básica y te
> mostramos cuántos contactos reales te trajo. Si sirve, después vemos plan mensual;
> si no sirve, no te cobramos nada.
>
> Confirmás acá 👉 {link_claim}
>
> Si no querés que aparezca tu perfil, avisame y lo bajo.

## 2. Opener telefónico — fijo poraca (canal B)

Guion, no libreto. Llamada corta:

> Hola, ¿hablo con {nombre}? Te llamo de Oficio, estamos armando una guía local de oficios
> verificados para San Martín y Junín. Te vi en el directorio con buena puntuación y quería
> saber si te interesa aparecer.
>
> Para los primeros prestadores es gratis 90 días: te armamos el perfil, hacemos una
> verificación básica y medimos si te trae contactos reales. Si sirve, después vemos plan
> mensual; si no, no te cobramos nada.
>
> ¿Te paso la info por WhatsApp? ¿A qué número te llega?

Anotar el móvil en el desk (`private_contact_ref`), **no** en notas de Obsidian.

## 3. Follow-up 48hs — una sola vez

> Hola {nombre}, te había escrito por el perfil en Oficio para {rubro} en {zona}.
> Si te interesa, se confirma acá 👉 {link_claim}
> Si no es para vos, ningún problema — no te escribo más. ¡Que andes bien!

Sin respuesta después de esto → `status = rejected`, no insistir.

## 4. Opt-out

Ante cualquier señal de baja ("no", "baja", "no me escribas", o pedido de bajar el perfil):

> Listo {nombre}, no te escribo más y doy de baja el perfil. Gracias por avisar 🙌

Acciones: `status = rejected` en el desk + bajar el perfil unclaimed en Supabase.
No re-contactar nunca más, por ningún canal.

## 5. Referidos (canal C — cabañas)

Los dos `P3 / cabanas` del desk no son prestadores objetivo: son **hubs de referidos**.
Administran propiedades y saben quién trabaja bien.

> Hola {nombre}, te escribo de Oficio, estamos armando una guía de oficios verificados para
> San Martín y Junín. Vos que manejás cabañas seguro tenés gente de confianza — ¿me pasarías
> el contacto de un electricista y un gasista que uses y recomiendes? Les escribo yo, de tu
> parte si te parece bien.

Mismo pedido cara a cara en ferreterías y corralones (no requiere desk).

## 6. Checklist de verificación básica

Antes de marcar `verified`:

- [ ] Confirmó identidad (nombre + DNI o matrícula subidos en `/verificacion`)
- [ ] Matrícula donde corresponde: gasista (matriculado obligatorio), electricista
- [ ] WhatsApp móvil confirmado — respondió por ese número
- [ ] Trabaja realmente dentro del radio SMA + Junín (<40 km aprox.)
- [ ] Rubro declarado coincide con el trabajo real
- [ ] Aceptó explícitamente aparecer publicado (consentimiento registrado en `claimed_at`)
- [ ] Foto de perfil y bio en primera persona, voseo

## 7. Instrucciones de envío manual

1. Pedir OK a Juguelio sobre el desk (30 filas) antes de cualquier contacto.
2. Sacar los `claim_token` con service_role (query de arriba) para las filas canal A.
3. Enviar **uno por uno, a mano**, desde el WhatsApp personal/comercial. Sin blast,
   sin API, sin n8n en este sprint.
4. Tope: **10–15 contactos por día**. Personalizar el nombre y el rubro en cada mensaje.
5. Registrar cada movimiento en `provider-desk-v0.csv`: `status` + `next_action`.
6. Los fijos (canal B) van por llamada primero, en horario comercial.
7. No prometer: emergencias 24/7, volumen de clientes, ni fecha de cobro.

## Estados del desk

```txt
target → contacted → interested → docs_pending → verified → rejected
```

## Reglas duras

- No mencionar paywall de emergencias ni los $20.000 por contacto.
- No prometer cantidad de contactos ni ingresos.
- No cobrar nada durante los 90 días.
- No contactar fuera del radio SMA + Junín.
- Voseo rioplatense siempre.
- Ningún teléfono ni dato personal sale a notas de Obsidian.
