# Handoff — arreglar el sistema de autenticación de Oficio

Copiá todo lo que sigue como prompt.

---

## Contexto

Oficio es un marketplace de oficios (React 18 + Vite + TS + React Router v7 + Supabase).
Repo: `~/Dev/oficio`. Leé `CLAUDE.md` completo antes de tocar nada: tiene las convenciones
del proyecto y son obligatorias.

**El sistema de login viene fallando hace días.** Se arreglaron bugs sueltos y siguen
apareciendo otros, lo que sugiere que el problema es de diseño y no de líneas puntuales.
Tu trabajo es dejarlo sólido de punta a punta, no parchar el próximo síntoma.

## Lo que YA está verificado — no vuelvas a investigarlo

**El backend de auth funciona.** Los logs de Supabase Auth de las últimas 24 h muestran
logins con status 200 (password y OAuth Google) mientras el usuario no podía entrar. Los
únicos 400 son explicables y viejos: dos `Invalid login credentials` (contraseña mal), un
`Invalid Refresh Token` y un `Email not confirmed` resuelto 26 segundos después. **Todos
los bugs encontrados hasta ahora fueron del cliente.** Empezá por el cliente.

La base también está bien: el usuario de prueba tiene `email_confirmed_at`, su fila en
`providers` con `status='active'` y `auth_user_id` correctamente linkeado.

## Bugs ya encontrados y corregidos (para que entiendas el patrón)

1. **`ProviderDashboard` redirigía a `/login` antes de que cargara la sesión.** El render
   evaluaba `if (user)` mientras `useAuth` seguía en `loading: true`, caía al bloque "sin
   sesión" y hacía `<Navigate to="/login" replace />`. Síntoma: "entrás, parpadea y volvés
   al login". **Causa raíz: redirigir por `!user` sin esperar `loading`.**

2. **`HomePage` no leía la sesión.** El header mostraba "Ingresar / Registrate" aunque
   estuvieras logueado, así que el login parecía fallar cuando había funcionado.

3. **El redirect de usuarios de Google apuntaba a `/onboarding`**, que es `OnboardingPage`
   (pantalla de presentación que no crea ningún perfil y tiene un botón a `/login`) en vez
   de `/registro/prestador` (el onboarding conversacional que sí crea la fila). Loop.

4. **Google no crea fila en `providers`.** El trigger `handle_new_provider` construye la
   fila desde `raw_user_meta_data`, y Google no manda `ciudad_id` ni `rubro_id`. Queda una
   cuenta que no resuelve ningún prestador. Se mitigó adoptando la fila en el onboarding
   conversacional cuando ya hay sesión, pero **no está probado de punta a punta.**

## Lo que sigue abierto

- **Síntoma reportado sin resolver:** entrar con Google usando un email nuevo devuelve al
  usuario al mismo lugar en vez de completar el alta. Reproducilo primero.
- **`useAuth` (`src/hooks/useAuth.ts`)**: `onAuthStateChange` hace
  `setState(prev => ({ ...prev, user, session }))` y **nunca toca `loading`**. Revisá si
  puede quedar `loading: true` colgado en algún camino.
- **`signUp()` llama a `supabase.auth.signOut({ scope: 'local' })` antes de registrar.**
  Entender por qué está y si rompe el caso "ya tengo sesión de Google y completo el alta".
- **`www` vs apex.** El sitio se sirve desde `https://www.oficioya.app` pero el dominio sin
  `www` también resuelve. La sesión de Supabase vive en `localStorage`, que es **por
  origen**: si el usuario entra por un host y algo lo manda al otro, la sesión desaparece.
  En los logs hay un `400: OAuth state not found or expired` compatible con esto. Verificá
  Site URL y Redirect URLs en Supabase y el dominio canónico en Vercel.
- **Hay DOS onboardings en paralelo**: `/registro/prestador` (`ConversationalOnboarding`)
  y `/registro/clasico` (`ProviderSignup`). Duplican validaciones y lógica de alta, y ya
  causaron que un arreglo se aplicara en uno solo. Proponé quedarte con uno.

## Qué tiene que funcionar cuando termines

Probá **cada uno** de estos caminos en producción, con cuentas nuevas y limpiando el
`localStorage` entre pruebas:

1. Alta con email + contraseña → confirma el mail → entra al panel y ve su perfil.
2. Alta con Google, email nuevo → completa ciudad/rubro/WhatsApp → **se crea la fila en
   `providers`** → entra al panel.
3. Login con contraseña de una cuenta existente → panel, sin parpadeos ni rebotes.
4. Login con Google de una cuenta existente → panel.
5. Recargar `/dashboard` con sesión activa (F5) → se queda en el panel, no rebota.
6. Entrar a `/dashboard` sin sesión → va a `/login` limpio, sin flash del panel.
7. Cuenta creada con Google que intenta entrar con contraseña → mensaje claro diciendo
   que use Google, no "credenciales incorrectas".
8. Cerrar sesión → el header vuelve a "Ingresar" en todas las páginas.

## Restricciones

- Named exports, sin `export default`. Tipos en `types.ts`. Sin `any`.
- Nada de llamadas a Supabase en componentes: van en hooks.
- Copy en español rioplatense con voseo.
- Colores solo con `var(--color-*)`. La app es light mode.
- `npx tsc --noEmit` tiene que pasar antes de cada commit.
- Los mensajes de error tienen que decirle al usuario **qué hacer**, no traducir el error
  de Supabase.

## Cómo trabajar esto

1. Reproducí cada uno de los 8 caminos y anotá cuál falla y con qué síntoma exacto.
2. Antes de tocar código, revisá **todos** los lugares que redirigen según el estado de
   auth y verificá que ninguno lo haga sin esperar `loading`. Ese fue el patrón de dos de
   los tres bugs encontrados. Buscá `Navigate to=`, `navigate('/login')`, `navigate('/')`.
3. Considerá centralizar: un solo guard de rutas (ya existe `ProtectedRoute`, que sí espera
   `loading`, pero `/dashboard` no lo usa y tiene lógica propia) y un solo lugar que decida
   a dónde va un usuario según tenga sesión y tenga o no fila en `providers`.
4. Si el arreglo correcto es reescribir el flujo en vez de parchar, hacelo — pero explicá
   primero qué vas a cambiar y por qué.
5. Cuando dudes entre suponer y medir, medí: los logs de Supabase Auth y la consola del
   navegador dan la respuesta en un minuto.

## Archivos que importan

```
src/hooks/useAuth.ts                              estado de sesión
src/lib/supabase.ts                               cliente (config por defecto)
src/lib/auth-signup.ts                            mensajes de alta duplicada
src/pages/ProviderLogin.tsx                       /login
src/pages/ProviderSignup.tsx                      /registro/clasico
src/pages/ConversationalOnboarding.tsx            /registro/prestador
src/pages/ProviderDashboard.tsx                   /dashboard
src/shared/components/ProtectedRoute.tsx          guard (no se usa en /dashboard)
src/app/Router.tsx                                rutas
supabase/migrations/20260731181952_*.sql          trigger handle_new_provider
```
