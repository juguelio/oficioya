# Emails de Oficio

Hoy los mails de autenticación salen del remitente por defecto de Supabase
(`noreply@mail.app.supabase.io`) con el diseño genérico de Supabase. Para un
prestador que acaba de recibir un WhatsApp nuestro, ese mail no parece nuestro:
es la primera prueba de que Oficio existe de verdad y no la pasa.

## 1. Cargar las plantillas (5 minutos, sin costo)

Supabase Dashboard → **Authentication → Emails**. Para cada tipo, pegar el HTML
y poner el asunto:

| Tipo en Supabase | Archivo | Asunto |
|---|---|---|
| Confirm signup | `confirmar-cuenta.html` | Confirmá tu cuenta en Oficio |
| Reset password | `recuperar-contrasena.html` | Cambiá tu contraseña de Oficio |

Las variables `{{ .ConfirmationURL }}` las reemplaza Supabase — no tocarlas.

## 2. Remitente propio (recomendado antes de la campaña)

Mientras el SMTP sea el de Supabase, el remitente sigue siendo
`noreply@mail.app.supabase.io` **aunque el diseño ya sea nuestro**, y ese
remitente tiene límite de envíos y peor entregabilidad (más chance de spam).

Para mandar desde `hola@oficioya.app`:

1. Crear cuenta en Resend (u otro SMTP; el free tier alcanza para el volumen de v1).
2. Verificar el dominio `oficioya.app` (registros SPF/DKIM en el DNS de Vercel).
3. Supabase → **Project Settings → Authentication → SMTP Settings**: host, puerto
   587, usuario y contraseña de Resend, y el remitente `hola@oficioya.app`.

Sin esto, el mail de confirmación de la cohorte fundadora puede terminar en spam
justo el día del outreach — y ahí perdemos al prestador sin enterarnos.

## Nota de producto

El **link vencido ya no es un callejón sin salida**: `RootLayout` intercepta el
error que Supabase devuelve en el hash de la URL y manda a `/login?authError=…`,
donde hay un botón para reenviar el mail de confirmación.
