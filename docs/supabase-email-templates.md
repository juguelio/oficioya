# Emails de Supabase Auth — plantillas de Oficio

Los emails salen hoy con el remitente **"Supabase Auth"** y el asunto **"Confirm Your Signup"**,
en inglés. Esto se cambia en el dashboard: **Authentication → Emails → Templates**.
No se puede tocar por migración ni por el MCP: es configuración del proyecto, no de la base.

## Antes de tocar las plantillas: el remitente

El nombre **"Supabase Auth"** y la dirección `noreply@mail.app.supabase.io` **no se pueden
cambiar desde las plantillas**. Salen del SMTP por defecto de Supabase, que además:

- está limitado a unos pocos mails por hora, y
- está pensado sólo para desarrollo — no para producción.

Para que diga "Oficio <hola@oficioya.app>" hay que configurar **SMTP propio** en
Authentication → Emails → SMTP Settings. Opciones usuales: Resend, Postmark, Brevo.
Mientras eso no esté, un prestador que se registra recibe un mail de un remitente
desconocido en inglés — y muchos no lo van a abrir.

---

## Confirm signup

**Subject:** `Confirmá tu cuenta en Oficio`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1A1714">
  <p style="font-size:20px;font-weight:800;letter-spacing:-0.02em;margin:0 0 24px">Oficio</p>

  <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.02em;margin:0 0 12px">Confirmá tu cuenta</h1>

  <p style="font-size:15px;line-height:1.6;color:#4a4a4a;margin:0 0 24px">
    Tocá el botón para activar tu perfil de prestador y empezar a recibir contactos
    de clientes de San Martín y Junín de los Andes.
  </p>

  <a href="{{ .ConfirmationURL }}"
     style="display:inline-block;background:#1E6FA5;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:9999px">
    Confirmar mi cuenta
  </a>

  <p style="font-size:13px;line-height:1.6;color:#9C9589;margin:28px 0 0">
    Si el botón no anda, copiá este link en tu navegador:<br>
    <span style="color:#1E6FA5;word-break:break-all">{{ .ConfirmationURL }}</span>
  </p>

  <p style="font-size:13px;line-height:1.6;color:#9C9589;margin:20px 0 0">
    Si no te registraste en Oficio, ignorá este mail.
  </p>
</div>
```

## Magic link

**Subject:** `Tu link para entrar a Oficio`

Mismo bloque, cambiando el título por `Entrá a tu cuenta`, el texto por
`Tocá el botón para entrar a tu panel. El link vence en una hora.` y el botón por
`Entrar a mi panel`.

## Reset password

**Subject:** `Cambiá tu contraseña de Oficio`

Mismo bloque, con título `Cambiá tu contraseña`, texto
`Pediste cambiar tu contraseña. Tocá el botón para elegir una nueva. Si no fuiste vos, ignorá este mail y tu contraseña sigue igual.`
y botón `Elegir nueva contraseña`.

## Change email address

**Subject:** `Confirmá tu nuevo email en Oficio`

Título `Confirmá tu nuevo email`, texto
`Pediste cambiar el email de tu cuenta a {{ .Email }}. Tocá el botón para confirmarlo.`
y botón `Confirmar el cambio`.

---

## Chequeo obligatorio de URLs

En **Authentication → URL Configuration**:

- **Site URL:** `https://oficioya.app`
- **Redirect URLs:** tienen que incluir `https://oficioya.app/dashboard` — es el
  `redirectTo` que usa el login con Google (`useAuth.signInWithGoogle`). Si falta, Google
  devuelve al Site URL y el usuario aterriza en el home, pareciendo deslogueado.
- Para desarrollo, sumar `http://localhost:3000/dashboard`.
