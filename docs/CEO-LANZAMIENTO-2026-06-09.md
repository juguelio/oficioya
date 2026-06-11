# Oficio — Informe CEO: lanzamiento y estado real
**2026-06-09 · Basado en: repo completo, migraciones Supabase, vault de Obsidian (01-Projects/oficio)**

---

## 1. Opinión honesta de CEO

**Oficio tiene el problema inverso a Descanso: acá sobra código y falta calle.**

Lo construido es serio: Supabase en producción (auth real, KYC con storage privado, realtime para guardia, 9 migraciones aplicadas), deploy en `oficioya.app`, `tsc --noEmit` limpio, un sistema de trabajos+presupuestos estilo CheckaTrade y hasta un router de emergencias por WhatsApp orquestado con n8n. Es infraestructura de una empresa con tracción — **construida antes de tener un solo prestador real registrado**.

Esto es sobre-construcción clásica. Un marketplace bilateral hiperlocal no se valida con features: se valida con un humano (vos) consiguiendo 20 electricistas y plomeros de San Martín por WhatsApp y ferretería. Si no estás dispuesto a hacer ese outreach, ningún sprint más de código va a mover la aguja — y conviene archivarlo sin culpa.

Tu propio vault lo dice desde antes: *"necesita una sesión de producto antes que más código"*. Esa sesión pedía respuestas a 6 preguntas. Acá van mis respuestas como CEO — confirmá o vetá:

| Pregunta (vault) | Decisión propuesta |
|---|---|
| ¿Alcance mínimo v1? | Directorio + perfil + WhatsApp + registro/KYC de prestador. **Nada más.** Trabajos y emergencias quedan ocultos |
| ¿3 ciudades o solo SMA? | **Solo San Martín de los Andes.** Densidad antes que cobertura |
| ¿WhatsApp Business API ya? | No. Baileys (o nada) hasta tener volumen — emergencias no está en v1 |
| ¿Paywall de emergencias en v1? | No. Es la capa de monetización fase 2; hoy ni siquiera hay demanda que gatear |
| ¿Suscripciones desde el día 1? | No. **Cohorte fundadora: 90 días gratis**, precio de lista visible ($20k/35k/55k) para anclar. MercadoPago se enciende recién al convertirlos |
| ¿Métrica de éxito? | 30 días: **≥15 prestadores reales verificados en SMA y ≥50 clics de WhatsApp/semana**. Si hay <10 prestadores tras 30 días de outreach → shelf |

**Compatibilidad con Descanso:** acabo de recomendarte 6 semanas de foco en Descanso. Oficio es compatible solo si su próxima fase es no-código: 2-3 h/semana de llamadas y visitas. El handoff técnico de abajo es chico a propósito (~1 día) — después de eso, el teclado se cierra hasta que la validación hable.

---

## 2. Estado técnico — hallazgos verificados

### 🔴 Seguridad
- **`CLAUDE.md` está trackeado en git y contiene credenciales Google OAuth en texto plano** (client_secret + refresh_token completo, líneas ~530 y ~640-645, las credenciales de Stitch). Está en el historial: hay que **revocar el token en la cuenta Google**, no solo borrarlo del archivo.

### 🟠 Importante para lanzar
- **Cero analytics.** No hay PostHog/Plausible/gtag ni conteo de clics. El ADR-001 promete "conteo de clics antes del redirect a WhatsApp" — no está implementado. Sin esto, la métrica de validación (clics/semana) no se puede medir. Es el fix más importante.
- **`/trabajos` muestra datos mock a usuarios reales** (6 trabajos + 4 presupuestos falsos, Zustand persist `oficio-jobs`), mientras providers ya lee de Supabase. Contenido falso en producción mata confianza en un pueblo chico. Ocultar hasta migrar.
- **SEO inexistente:** `index.html` tiene `<title>Oficio</title>` y nada más — sin meta description, sin OG, sin keywords locales. Para un negocio cuyo canal natural es "electricista san martín de los andes" en Google, esto es regalar el canal.
- **`ProviderProfile.tsx:67` revela `wa.me` directo sin tracking** (y sin gating de guardia, pero eso es fase 2 — por ahora solo falta el evento).

### 🟡 Menor
- **`CLAUDE.md` desactualizado vs realidad:** dice "fase 1 = mock data, Supabase no empezado" pero providers/auth/storage/realtime están en producción. El archivo se autodeclara fuente de verdad y hoy miente — riesgo para futuras sesiones de Code.
- Auto-deploy de Vercel desde `main` quedó pendiente desde el 2026-05-31 (se deployó por CLI).
- `.git/index.lock` huérfano en el repo (operación git interrumpida).

### ✅ Verificado y sano
`tsc --noEmit` pasa limpio · `.env.local` NO trackeado · sin "Junín de los Andes" ni USD en `src/` · flujo cliente (ciudad → rubro → perfil → WhatsApp) completo · auth + KYC + guardia toggle + realtime funcionando contra Supabase.

---

## 3. Plan de lanzamiento (validación primero)

**Posicionamiento:** *"Los oficios de la montaña, verificados."* Sin app que instalar, sin formularios: ves quién es, ves que está verificado, le escribís por WhatsApp.

### Fase 0 — Oferta (semanas 1-4, SMA solamente) — trabajo de calle
- Objetivo: **20 prestadores fundadores** (2-3 por rubro crítico: electricista, plomero, gasista, calefaccionista, cerrajero).
- Canal: outreach directo — WhatsApp, recomendaciones, ferreterías y corralones (los que atienden el mostrador saben quién trabaja bien). Pitch: "gratis 90 días, perfil verificado, te mandamos clientes; después, si te sirve, $20k/mes".
- El KYC ya construido (DNI + matrícula) es el diferencial del pitch: "verificado" vale oro en un pueblo donde todos se conocen.
- En paralelo: el handoff técnico (1 día de Code) — analytics, ocultar mocks, SEO, credenciales.

### Fase 1 — Demanda (semanas 5-8)
- **Grupos de Facebook de compra/venta de SMA** — el canal hiperlocal #1 de la Patagonia. Posts útiles, no spam: "¿buscás gasista matriculado? acá hay 4 verificados con reseñas".
- **Google Business Profile + SEO local** — keywords "electricista/plomero san martín de los andes" tienen búsqueda real y competencia casi nula.
- **Distribución prestada:** los propios prestadores comparten su perfil en sus estados de WhatsApp (dales una imagen linda de su perfil para compartir — costo cero, alcance directo a su clientela).
- Pauta opcional mes 2: Meta geo-targeted SMA, USD 50-100. No antes de tener 15 prestadores arriba.

### Fase 2 — Monetización (mes 3+, solo si la métrica se cumple)
- ≥15 prestadores activos + ≥50 clics WhatsApp/semana → encender MercadoPago para suscripciones (convertir cohorte fundadora con descuento de lealtad).
- Emergencias 24/7 con paywall: recién después de que las suscripciones base funcionen. El router n8n ya construido espera ahí.

### Kill criteria (honestidad operativa)
- 30 días de outreach y <10 prestadores → shelf del proyecto, sin más inversión de código.
- Mes 3 con prestadores pero <20 clics/semana → problema de demanda: revisar SEO/Facebook antes de tocar producto.

---

## Próximos 7 días
1. Revocar el token Google y limpiar CLAUDE.md (fix #1 del handoff) — hoy.
2. Ejecutar el resto del handoff técnico (analytics de clics, ocultar /trabajos, SEO) — 1 día de Code.
3. Confirmar/vetar las 6 decisiones de producto de la tabla de arriba (reemplaza la "sesión de 1.5h" pendiente en el vault).
4. Armar la lista de los primeros 30 prestadores objetivo de SMA (nombres reales, de ferretería y recomendaciones) y empezar el outreach.
