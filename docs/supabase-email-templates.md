# Supabase Auth — configuración del proyecto (emails y URLs)

Esta nota cubre lo que **no vive en el repo**: plantillas de email y URLs de
retorno son configuración del proyecto Supabase, no de la base. No se aplican por
migración, ni por el CLI, ni por el MCP — se cargan a mano en el Dashboard.

> **El HTML de las plantillas no está acá.** Vive versionado en
> `ops/email-templates/`, con el procedimiento exacto de aplicación en el README
> de esa carpeta. Antes esta nota tenía su propia copia del HTML y las dos
> versiones ya habían divergido; ahora hay una sola fuente.

## Plantillas de email

| Tipo en Supabase | Archivo | Asunto exacto |
|---|---|---|
| Confirm signup | `ops/email-templates/confirmar-cuenta.html` | `Confirmá tu cuenta en Oficio` |
| Reset password | `ops/email-templates/recuperar-contrasena.html` | `Cambiá tu contraseña de Oficio` |

Magic Link, Change Email Address e Invite quedan en el default de Supabase: hoy
la app no dispara ninguno de esos mails. Si alguno se empieza a usar, la
plantilla se escribe primero en `ops/email-templates/`.

Cómo cargarlas y cómo verificarlas (incluido el chequeo de acentos, que es el que
delata un `charset` perdido al pegar): `ops/email-templates/README.md`.

## Antes de tocar las plantillas: el remitente

El nombre **"Supabase Auth"** y la dirección `noreply@mail.app.supabase.io` **no
se cambian desde las plantillas**. Salen del SMTP por defecto de Supabase, que
además está limitado a unos pocos mails por hora y está pensado sólo para
desarrollo.

Para que diga "Oficio <hola@oficioya.app>" hay que configurar **SMTP propio** en
Authentication → Emails → SMTP Settings (Resend, Postmark, Brevo). Las
credenciales van sólo ahí: **no se versionan en este repo**. Mientras eso no
esté, un prestador que se registra recibe un mail de un remitente desconocido —
y muchos no lo van a abrir.

---

## URL Configuration — a validar en el Dashboard

**Authentication → URL Configuration.** Nada de esto es verificable desde el
repo: hay que abrir el Dashboard y confirmarlo.

- **Site URL:** `https://www.oficioya.app`
  Con `www`. Es el dominio canónico: el apex redirige (301) hacia ahí por
  `vercel.json`, y `useSeo` publica el mismo canonical. Importa más de lo que
  parece: la sesión de Supabase vive en `localStorage`, que es **por origen**, y
  el Site URL es adonde Supabase manda cuando algo no coincide.

- **Redirect URLs:** tiene que incluir **`https://www.oficioya.app/dashboard`**.

  Es la **única** URL de retorno que el código usa para OAuth. La arma
  `oauthRedirectUrl()` (`src/lib/auth-redirect.ts`) y la consume
  `useAuth.signInWithGoogle`. Antes cada camino mandaba la suya —
  `/mis-trabajos` en el alta de cliente, y cualquier ruta privada guardada por
  `ProtectedRoute` en `?next=` — lo que obligaba a tener una entrada por ruta en
  esta lista. **Si una `redirectTo` no está en la lista, Supabase no falla:
  redirige al Site URL**, y el usuario aterriza en el home con la sesión creada,
  leyendo eso como "el login con Google no anda". Hoy el destino que el usuario
  pidió no viaja en la URL: queda guardado del lado del cliente y lo aplica
  `RootLayout` al volver a `/dashboard`.

- Para desarrollo, sumar `http://localhost:3000/dashboard`.
  Las previews de Vercel tienen un host distinto por deploy: el login con Google
  desde una preview vuelve al Site URL de producción salvo que se agregue esa URL
  a mano.

### Cómo validarlo sin adivinar

1. Abrir el Dashboard y comparar la lista contra lo de arriba.
2. Probar en producción, con `localStorage` limpio: entrar a `/perfil` sin
   sesión → rebota a `/login?next=%2Fperfil` → **Continuar con Google** → tiene
   que terminar en `/perfil`, logueado. Si termina en el home, falta la entrada
   en Redirect URLs.
3. Repetir desde `/registro/cliente` con Google: tiene que terminar en
   `/mis-trabajos`.
