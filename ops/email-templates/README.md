# Emails de Oficio

Los mails de autenticación salen del remitente por defecto de Supabase
(`noreply@mail.app.supabase.io`). Para un prestador que acaba de recibir un
WhatsApp nuestro, ese mail es la primera prueba de que Oficio existe de verdad:
si llega en inglés y con el diseño genérico de Supabase, no la pasa.

**Estos archivos son la fuente de verdad de las plantillas.** El HTML no se
escribe en el Dashboard: se edita acá, se versiona, y se pega. `docs/supabase-email-templates.md`
sólo documenta la configuración del proyecto — no duplica HTML.

| Tipo en Supabase | Archivo | Asunto exacto |
|---|---|---|
| Confirm signup | `confirmar-cuenta.html` | `Confirmá tu cuenta en Oficio` |
| Reset password | `recuperar-contrasena.html` | `Cambiá tu contraseña de Oficio` |

Los otros tipos (Magic Link, Change Email Address, Invite) siguen en el default
de Supabase **a propósito**: hoy la app no dispara ninguno. Si algún día se usan,
la plantilla se agrega acá primero.

## Por qué son documentos HTML completos

Antes eran fragmentos que arrancaban directo en `<table>`. Sin `<meta charset="utf-8">`,
un cliente de mail que no adivine el encoding muestra `ConfirmÃ¡ tu cuenta` —
justo en las palabras acentuadas, que en rioplatense son casi todas. Cada archivo
lleva ahora:

- `<!doctype html>` + `<html lang="es">` + `<head>` con `charset` y `viewport`.
- `color-scheme: light`, para que el modo oscuro de Gmail/Outlook no invierta los
  fondos y deje texto claro sobre claro.
- Línea de vista previa (lo que se lee en la bandeja al lado del asunto).
- **El link en texto además del botón.** Varios clientes rompen el botón o lo
  abren en un navegador embebido sin sesión; sin el link a la vista, eso es un
  callejón sin salida.
- Colores espejados de `src/design-system/theme.css` (en un mail no hay CSS
  variables) y sin `rgba()`, que Outlook ignora.

## 1. Cargar las plantillas (5 minutos, sin costo)

Se hace **a mano en el Dashboard**: son configuración del proyecto, no de la base.
No se pueden aplicar por migración, ni por el CLI, ni por el MCP de Supabase.

1. Supabase Dashboard → proyecto de Oficio → **Authentication → Emails → Templates**.
2. Elegir el tipo (`Confirm signup`).
3. **Subject heading:** pegar el asunto exacto de la tabla de arriba.
4. **Message body:** borrar todo el contenido y pegar el archivo **completo**,
   desde `<!doctype html>` hasta `</html>`.
5. Guardar y repetir con `Reset password`.

### Reglas al pegar

- **No tocar `{{ .ConfirmationURL }}`.** Es la variable que Supabase reemplaza por
  el link real; si se edita, aunque sea un espacio adentro de las llaves, el mail
  sale con un link muerto.
- No hace falta ninguna credencial para esto. **Nunca pegar tokens, claves de
  servicio ni URLs con `access_token` en estos archivos ni en el Dashboard.**
- Los archivos no contienen datos personales: no personalizar con nombre, teléfono
  ni email de nadie.
- El cambio es inmediato para los mails **nuevos**; los ya enviados no se
  reescriben.

## 2. Verificar (obligatorio, mismo día)

1. Registrar una cuenta de prueba con un email propio en `/registro/prestador`.
2. Revisar en el mail que llega:
   - asunto en español y remitente esperado;
   - **acentos y eñes correctos** (`Confirmá`, `contraseña`) — si se ven como
     `Ã¡`, el `charset` se perdió al pegar;
   - el botón azul lleva al sitio y la cuenta queda confirmada;
   - el link en texto abre lo mismo que el botón.
3. Probarlo también en Gmail con **modo oscuro** activado.

Ojo con el límite: el SMTP por defecto de Supabase permite **pocos mails por
hora**. Si las pruebas dejan de llegar, casi siempre es rate limit y no la
plantilla.

## 3. Remitente propio (recomendado antes de la campaña)

Mientras el SMTP sea el de Supabase, el remitente sigue siendo
`noreply@mail.app.supabase.io` **aunque el diseño ya sea nuestro**, y ese
remitente tiene límite de envíos y peor entregabilidad (más chance de spam).

Para mandar desde `hola@oficioya.app`:

1. Crear cuenta en Resend (u otro SMTP; el free tier alcanza para el volumen de v1).
2. Verificar el dominio `oficioya.app` (registros SPF/DKIM en el DNS de Vercel).
3. Supabase → **Authentication → Emails → SMTP Settings**: host, puerto 587,
   usuario y contraseña de Resend, y el remitente `hola@oficioya.app`.
   Las credenciales van sólo ahí: **no se versionan en este repo**.

Sin esto, el mail de confirmación de la cohorte fundadora puede terminar en spam
justo el día del outreach — y ahí perdemos al prestador sin enterarnos.

## Nota de producto

El **link vencido ya no es un callejón sin salida**: `RootLayout` intercepta el
error que Supabase devuelve en el hash de la URL y manda a `/login?authError=…`,
donde hay un botón para reenviar el mail de confirmación.
