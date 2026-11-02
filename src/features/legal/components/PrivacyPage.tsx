import { LegalLayout, Section } from './LegalLayout'
import { CONTACTO_EMAIL, FUNDADOR, FUNDADOR_CIUDAD } from '@/shared/components/Footer'

/**
 * BORRADOR. Refleja lo que la plataforma hace hoy, no una plantilla genérica.
 * Si cambia qué datos se recolectan o qué terceros intervienen, hay que actualizarla:
 * una política que no describe la realidad es peor que no tenerla.
 */
export function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad" updated="31 de julio de 2026">

      <Section title="Quiénes somos">
        <p>
          Oficio es una plataforma que conecta vecinos con trabajadores de oficios en San
          Martín de los Andes y Junín de los Andes, provincia de Neuquén, Argentina. La armó
          y la lleva adelante <strong className="text-nieve">{FUNDADOR}</strong>, de {FUNDADOR_CIUDAD}.
          Podés escribirnos a <a className="underline" href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a> por
          cualquier tema de esta política.
        </p>
      </Section>

      <Section title="Qué datos recolectamos">
        <p><strong className="text-nieve">Si sos prestador y creás una cuenta:</strong> nombre, email,
          teléfono de WhatsApp, ciudad, barrio o zona, oficio, descripción de tu trabajo y, si la
          subís, una foto de perfil. Si iniciás sesión con Google, recibimos tu email y nombre
          de esa cuenta, no tu contraseña.</p>

        <p><strong className="text-nieve">Si pedís la verificación:</strong> imágenes de DNI o
          matrícula profesional. Estos archivos se guardan en almacenamiento privado, separados
          del perfil público, y solo son accesibles por vos y por nosotros.</p>

        <p><strong className="text-nieve">Si sos cliente:</strong> no necesitás cuenta para buscar
          ni para contactar. Si publicás un trabajo, guardamos tu nombre y teléfono para que los
          prestadores puedan responderte.</p>

        <p><strong className="text-nieve">De todos los visitantes:</strong> datos de uso anónimos
          (páginas vistas, clics en el botón de WhatsApp) para entender qué funciona. No usamos
          esa información para identificarte.</p>
      </Section>

      <Section title="Perfiles que armamos nosotros">
        <p>
          Para que la plataforma sea útil desde el primer día, armamos perfiles preliminares de
          prestadores de la zona con información <strong className="text-nieve">publicada
          públicamente</strong> por ellos mismos — principalmente nombre comercial, rubro y teléfono
          de contacto que figuran en directorios y perfiles de negocio.
        </p>
        <p>
          Mientras ese perfil no fue reclamado por su titular, no mostramos su número de contacto.
          Si tenés un perfil así y no querés aparecer, escribinos y lo damos de baja sin
          preguntarte nada.
        </p>
      </Section>

      <Section title="Con quién compartimos datos">
        <p>Solo con los servicios necesarios para que la plataforma funcione:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className="text-nieve">Supabase</strong> — base de datos, cuentas y
            almacenamiento de archivos.</li>
          <li><strong className="text-nieve">Vercel</strong> — hosting del sitio.</li>
          <li><strong className="text-nieve">Google</strong> — solo si elegís iniciar sesión
            con tu cuenta de Google.</li>
          <li><strong className="text-nieve">MercadoPago</strong> — cobro de suscripciones y de
            contactos de urgencia. Los datos de tu tarjeta los maneja MercadoPago; nosotros nunca
            los vemos ni los guardamos.</li>
          <li><strong className="text-nieve">PostHog</strong> — métricas de uso agregadas.</li>
        </ul>
        <p>No vendemos datos personales ni los cedemos a anunciantes.</p>
      </Section>

      <Section title="Qué se ve en público">
        <p>
          El perfil de un prestador activo es público: nombre, oficio, ciudad, barrio,
          descripción, foto, reseñas y número de WhatsApp. Es el objeto del servicio — los
          clientes tienen que poder encontrarte y escribirte.
        </p>
        <p>
          El número de los prestadores en modo guardia queda oculto hasta que el cliente abona el
          contacto de urgencia. Tu email, tus documentos de verificación y tus datos de pago
          nunca son públicos.
        </p>
      </Section>

      <Section title="Cuánto tiempo guardamos tus datos">
        <p>
          Mientras tengas cuenta activa. Si la das de baja, borramos tu perfil público y tus
          documentos de verificación. Podemos conservar registros de operaciones cobradas por el
          plazo que exige la normativa fiscal y contable argentina.
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          La Ley 25.326 de Protección de Datos Personales te da derecho a acceder a tus datos,
          rectificarlos, actualizarlos y pedir su supresión. Escribinos
          a <a className="underline" href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a> y
          respondemos dentro de los plazos de ley: 10 días corridos para acceso, 5 días hábiles
          para rectificación o supresión.
        </p>
        <p>
          La Agencia de Acceso a la Información Pública es el organismo de control y atiende las
          denuncias por incumplimiento.
        </p>
      </Section>

      <Section title="Cookies y almacenamiento local">
        <p>
          Guardamos en tu navegador la ciudad que elegís, para no volver a preguntártela, y la
          sesión si iniciaste sesión. No usamos cookies publicitarias ni de seguimiento entre
          sitios. El detalle completo está en la{' '}
          <a className="underline" href="/cookies">Política de cookies</a>.
        </p>
      </Section>

      <Section title="Menores de edad">
        <p>
          La plataforma está dirigida a mayores de 18 años. No recolectamos datos de menores a
          sabiendas; si detectamos una cuenta de un menor, la damos de baja.
        </p>
      </Section>

      <Section title="Cambios">
        <p>
          Si modificamos esta política actualizamos la fecha del encabezado. Cuando el cambio sea
          significativo, avisamos a los prestadores registrados por email.
        </p>
      </Section>

    </LegalLayout>
  )
}
