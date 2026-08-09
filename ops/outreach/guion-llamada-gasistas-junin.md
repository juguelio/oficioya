# Guion de llamada — gasistas matriculados de Junín de los Andes

**Estado: LISTO, NO EJECUTADO.** Ninguna llamada sale sin OK explícito de Juguelio.

Cohorte: 36 matriculados de Camuzzi Gas del Sur domiciliados en Junín (`ops/outreach/provider-desk-junin-v0.csv`, ref `camuzzi:<matrícula>`). Contactos en el archivo privado del scratchpad, **fuera del repo**.

## Por qué estos primero

Son los mejores candidatos del proyecto y conviene tener claro el motivo:

- **Matrícula vigente ante la distribuidora de gas.** Verificable, no es un rating de Google.
- **No salieron de Google Places**, así que no tienen el problema de clasificación que contaminó los otros rubros (corralones etiquetados como albañiles, talleres de chapa como pintores).
- **Gas es el rubro de mayor urgencia real**: pérdida, caldera, termotanque. Alta intención de contacto.
- En Argentina el gasista matriculado suele cubrir **también plomería y calefacción** → un contacto puede tapar tres rubros críticos.
- **17 de los 36 están habilitados en SMA y Junín**, así que cubren el radio entero.

## Orden de llamada

1. **Categoría primera + habilitado en ambas localidades** (mayor complejidad, cubre todo el radio)
2. Categoría primera o segunda
3. Categoría tercera
4. Los que el registro no publica teléfono usable (15 de 36) → buscar por nombre o visita

El desk ya viene ordenado por ese criterio: P1 primero.

## Antes de marcar

- [ ] Horario comercial, días de semana. Un gasista a las 8 de la mañana está entrando a una obra.
- [ ] Tener el nombre a mano y pronunciarlo bien.
- [ ] Saber la categoría de esa persona (está en el desk).
- [ ] Tener el link de claim listo para mandar en el momento si dice que sí.
- [ ] Saber de memoria la promesa: **60 días gratis para los primeros 30, y si no te trajo trabajo no pagás**. Es la única frase que no se improvisa: tiene que decir lo mismo que el sitio.
- [ ] Anotar el resultado en el desk **durante** la llamada, no después.

## El guion

Guion, no libreto. La idea es sonar como un vecino que está armando algo, no como un call center.

> — Hola, ¿hablo con {nombre}?
>
> Te llamo de **Oficio**, es una guía local de oficios para San Martín y Junín. Te saqué del registro de matriculados de Camuzzi.
>
> *(pausa — dejalo ubicarse)*
>
> Estamos armando el listado de gasistas de la zona y quería preguntarte si te interesa aparecer. **Los primeros 30 tienen 60 días gratis**: te armamos el perfil, y la gente que necesita un gasista te escribe directo por WhatsApp. Sin intermediarios, vos manejás tu agenda y tus precios.
>
> Y si en esos 60 días no te trajo trabajo, no tenés nada que pagar.

**Las cuatro preguntas** (el objetivo real de la llamada):

1. *¿Este número recibe WhatsApp, o tenés otro?* — 15 de 36 no tienen teléfono usable en el registro, y los otros 21 están en formato ambiguo. Esto es lo más importante que traés de la llamada.
2. *¿Trabajás en Junín, en San Martín, o en las dos?* — confirma el radio.
3. *¿Además de gas hacés plomería o calefacción?* — puede tapar tres rubros.
4. *¿Te parece bien que te mande el link para confirmar tu perfil?*

## Si dice que sí

> Perfecto. Te mando el link por WhatsApp ahora. Lo abrís, ves tu perfil ya armado, confirmás que sos vos y queda activo. Es un toque.

Mandar en el momento, mientras está la conversación fresca:

```
Hola {nombre}, soy {tu nombre} de Oficio — recién hablamos.
Este es tu perfil, confirmalo con un toque: {link_claim}
Cualquier cosa me escribís por acá.
```

Estado en el desk → `interested`. Cuando confirma → `verified` (o `docs_pending` si falta matrícula/DNI).

## Si dice que no

> Sin problema, {nombre}. Gracias por atenderme. Si más adelante te interesa, estamos en oficioya.app. ¡Que andes bien!

Estado → `rejected`. **No volver a llamar.** No mandarle WhatsApp "por si acaso".

## Si duda

La objeción más probable es *"¿y esto qué me cuesta?"* o *"¿quién sos?"*.

> Sesenta días no te cuesta nada, sin tarjeta ni nada. Somos de acá, estamos arrancando con San Martín y Junín. En la página vas a ver precios de $20.000 para arriba: **eso es para después de los 60 días**, y si en ese tiempo no te trajimos trabajo, no pagás. Si querés mirala primero y te llamo la semana que viene.

Estado → `contacted`, con nota. Un solo re-contacto, a los 14 días.

## Si dice "pero en la página dice $20.000"

Va a pasar: `/planes` muestra Básico $20.000, Profesional $35.000 y Destacado $55.000, y arriba
de todo un cartel que dice que hoy no se cobra. Que lo vea es bueno — significa que el precio no
se lo escondiste. La respuesta es la misma que le diste por teléfono, sin cambiarle una coma:

> Sí, esos son los planes para después. Vos entrás en los primeros 30, así que tenés 60 días
> gratis desde que activás — y si en esos 60 días no te trajimos trabajo, no pagás nada. Está
> escrito arriba de los precios, fijate.

**Nunca** contestar "no le des bola a eso" ni "eso es viejo". El número es real y va a llegar.

## Si pregunta cómo conseguiste su número

Decir la verdad, sin rodeos:

> Del registro público de instaladores matriculados de Camuzzi. Si preferís que no aparezcas, lo saco ahora mismo y no te molesto más.

Y si lo pide: **sacarlo en el momento**. Ese pedido se respeta sin negociar.

## Lo que NO se dice

- ❌ "Emergencias 24/7" ni los $20.000 por contacto — no existe todavía, hay 0 prestadores en guardia.
- ❌ Prometer cantidad de clientes o de contactos.
- ❌ Decir que está "verificado" antes de que presente matrícula o DNI.
- ❌ Hablar de otros gasistas por nombre. Pueblo chico.
- ❌ Cambiarle el número a la oferta. Son **60 días** y **30 lugares**, no 90 ni "los primeros que se anoten". Es lo que dice el sitio y lo que va a leer cuando toque el link.
- ❌ Decir cuántos lugares quedan. No hay contador y no lo vamos a inventar.

## Meta de la primera tanda

10 llamadas. Y lo que se mide **no** es cuántos dicen que sí:

```
WhatsApp confirmados      ← el dato que desbloquea todo el resto
cubren SMA + Junín
además hacen plomería/calefacción
interesados
perfiles activados
```

Si de 10 llamadas salen 3 WhatsApp confirmados y 1 perfil activado, el canal funciona.
Si salen 0 interesados sobre 10, el problema es el pitch o el canal — **parar y repensar**, no llamar a los 26 restantes.

## Pedir referidos

A todo el que atienda bien, aunque diga que no:

> Che, ¿conocés algún electricista o plomero de Junín que trabaje bien? Estamos armando el listado y preferimos gente recomendada.

Junín tiene **1 electricista y 0 plomeros** en el sitio. Un gasista matriculado conoce a todos.
