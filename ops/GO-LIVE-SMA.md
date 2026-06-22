# Go-live San Martín de los Andes — runbook + reclutamiento

Objetivo de esta etapa: **probar el loop con gente real en SMA**, no sumar features.
Loop mínimo: un vecino entra → encuentra un prestador por rubro → lo contacta por WhatsApp.
Métrica de éxito de las primeras 2–4 semanas: **10–15 prestadores reales activos** en SMA y
**5–10 contactos reales** cliente→prestador. Si eso pasa, el modelo funciona y recién ahí se
escala (automatización, pago, otras ciudades).

---

## Parte 1 — Deploy técnico (lo corrés vos)

### 1.1 Migraciones Supabase (en orden)
`supabase db push` aplica todas las de `supabase/migrations/` en orden. Antes, OJO con esto:

> ⚠️ **`20260403000001_seed_providers.sql` carga prestadores MOCK (falsos).**
> Para producción NO querés 40 prestadores inventados en San Martín/VLA/Bariloche.
> Opción A (recomendada): **no apliques ese archivo** (renombralo a `.skip` o comentá su
> contenido) antes del push.
> Opción B: aplicá todo y después purgá lo mock con:
> ```sql
> delete from providers where auth_user_id is null;   -- los reales tienen auth_user_id
> delete from reviews;                                  -- reseñas mock si las hubiera
> ```
> Los mock no tienen `auth_user_id` (se crean sin cuenta), así que esa query es segura.

Migraciones que SÍ van a prod: initial_schema, storage_and_auth_trigger, emergency_requests,
emergency_rpc, outreach_log, provider_docs_bucket, enable_realtime_providers,
`..009` bio, `..010` prospects, `..011` reviews_and_certifications, `..012` link_prospect,
`..013` jobs_and_quotes.

Después del push, en el SQL editor verificá la vista de trabajos:
```sql
select * from open_jobs limit 1;   -- si da error de permisos, revisá security_invoker (ver nota abajo)
```

### 1.2 Deploy app (Vercel)
- Conectá el repo a Vercel (o `vercel --prod`). Dominio `oficioya.app`.
- Env de producción (mínimo para el v1): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Opcionales (no bloquean): `VITE_POSTHOG_KEY` (medir clics de WhatsApp), webhooks n8n.
- El build falla en este entorno por el binario rollup de Linux, pero en tu Mac/Vercel
  compila normal. `npx tsc --noEmit` ya pasa limpio.

### 1.3 (Opcional) Default de ciudad a San Martín
Como el foco es SMA, podés arrancar a todos en San Martín y sacar el paso "elegí ciudad".
En `src/features/search/store.ts`, cambiá el estado inicial:
```ts
ciudadId: 'san-martin',   // antes: null
```
(Es persistido, así que sólo afecta usuarios nuevos. Reversible.)

### 1.4 Smoke test (5 min, en el celu)
1. Home → ciudad San Martín → ves rubros → ves prestadores (después de cargar los reales).
2. Abrí un perfil → el botón **Contactar por WhatsApp** abre `wa.me/...` correcto.
3. Alta de prestador en `/registro/prestador` (onboarding por agente) → crea la cuenta.
4. Login → `/dashboard` → ves TU perfil real (no el selector mock).
5. Publicar un trabajo en `/trabajos/nuevo` → te da el link privado `?t=...`.
6. Con otra cuenta (prestador activo) entrá al trabajo → enviá presupuesto.
7. Con el link privado, aceptá el presupuesto → aparece el WhatsApp del prestador.

> Nota `open_jobs`: la vista depende de `security_invoker=false` (default de Postgres) para
> exponer sólo columnas seguras saltando el RLS de `jobs`. Si tu Supabase la creó con
> `security_invoker=true`, el board no devolvería filas → corregí con
> `alter view open_jobs set (security_invoker = false);`

---

## Parte 2 — Reclutamiento manual (lo más importante, lo hacés vos)

La automatización de WhatsApp que armamos es para DESPUÉS. Para arrancar, "hacé cosas que no
escalan": conseguí los primeros 10–15 prestadores **a mano**, aprovechando que vivís en SMA.

### 2.1 A quién (rubros prioritarios para SMA)
Priorizá los de **demanda frecuente + urgencia** (los que más se buscan):
1. **Gasista matriculado** (frío fuerte → calefacción, estufas, calderas). Crítico en SMA.
2. **Electricista**.
3. **Plomero / destapaciones** (gap del directorio → buscalos vos: son los más difíciles de
   encontrar y los que más bronca generan cuando faltan).
4. **Calefaccionista / service de calderas y salamandras**.
5. **Cerrajero** (urgencias).
6. **Carpintero**, **albañil**, **pintor**, **techista**, **mantenimiento de cabañas**
   (SMA tiene MUCHA cabaña y segunda vivienda → nicho fuerte).

### 2.2 Dónde (canales locales)
- **Tu red directa primero.** El gasista/electricista que YA usás. Pediles que se sumen y que
  te recomienden 2 colegas. Bola de nieve.
- **Ferreterías y corralones de SMA** (donde compran los oficios): dejá flyer / hablá con el
  mostrador, ellos conocen a todos.
- **Grupos de Facebook locales** de compra/venta/servicios y "se busca" de San Martín
  (buscalos en FB; cambian de nombre seguido). La [Municipalidad de SMA](https://www.facebook.com/municipalidadsma/)
  y páginas de comercio local sirven para difundir.
- **Colegio de gasistas/electricistas matriculados de Neuquén** → lista de matriculados de la zona.
- **Boca a boca / radio local** (FM locales tienen mucha escucha en el corredor).

### 2.3 El pitch (gratis, sin riesgo)
> "Estoy lanzando **Oficio**, una app para que los vecinos de San Martín encuentren oficios de
> confianza. Para vos es **gratis**: te doy de alta, aparecés en tu rubro, y los clientes te
> escriben **directo a tu WhatsApp**, sin comisión ni intermediarios. ¿Te sumo? Son 2 minutos."

Clave: **gratis y sin comisión** al principio. No menciones la suscripción todavía (ver §4).

### 2.4 Cómo cargarlos
- Que se den de alta solos en `oficioya.app/registro/prestador` (onboarding por agente), o
- Cargalos vos en una sentada (mismo flujo), con su OK, mientras tomás un café con cada uno.
- Sacales una foto buena de perfil ahí mismo — sube la conversión un montón.

---

## Parte 3 — Generar la primera demanda

Tener prestadores sin clientes no prueba nada. En paralelo:
- **Usala vos y tu entorno.** La próxima vez que alguien cercano necesite un oficio, que lo
  busque por Oficio y contacte por ahí. Cada contacto real es una prueba del loop.
- **Publicá 2–3 trabajos reales** (los tuyos o de conocidos) para que los prestadores reciban
  el aviso y oferten → probás el módulo de trabajos con plata real.
- **Difusión simple:** un posteo en los grupos locales: "¿Buscás electricista/gasista/plomero en
  San Martín? Probá oficioya.app". Sin pauta paga todavía.

---

## Parte 4 — Qué medir y cuándo escalar

Medí (con PostHog ya integrado, o a mano):
- **Prestadores activos** en SMA.
- **Clics de WhatsApp** (contactos reales) — la métrica norte (ADR-001).
- **Trabajos publicados** y **presupuestos enviados**.

Encendé la siguiente palanca SÓLO cuando la anterior funcione:
1. Loop manual probado (contactos reales que se concretan) →
2. Encendé el **outreach automatizado** (n8n + WhatsApp Business API) para sumar oferta más rápido →
3. Cuando los prestadores ya reciben trabajo por la app, **introducí la suscripción** (ahí el
   plan tiene sentido: pagan porque les trae clientes) →
4. Recién después: **MercadoPago**, **emergencias 24/7 con paywall**, y **otras ciudades** (VLA primero, está al lado).

---

## Parte 5 — Qué NO hacer todavía

- ❌ No cobres suscripción antes de traerles clientes (nadie paga por una vidriera vacía).
- ❌ No abras las 3 ciudades a la vez: concentrá liquidez en SMA.
- ❌ No esperes a la automatización de WhatsApp para reclutar: arrancá a mano.
- ❌ No sumes más features hasta que el loop mínimo convierta con gente real.
