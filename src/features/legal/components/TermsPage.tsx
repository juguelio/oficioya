import { LegalLayout, Section } from './LegalLayout'
import { CONTACTO_EMAIL } from '@/shared/components/Footer'

/**
 * BORRADOR. El punto delicado es el rol de Oficio: somos un lugar de encuentro, no
 * la parte que contrata ni que ejecuta el trabajo. Si eso cambia (por ejemplo si en
 * algún momento Oficio garantiza o media en el trabajo), estos términos dejan de ser
 * ciertos y cambia la responsabilidad legal.
 */
export function TermsPage() {
  return (
    <LegalLayout title="Términos y condiciones" updated="30 de agosto de 2026">

      <Section title="Qué es Oficio y qué no es">
        <p>
          Oficio es un lugar donde vecinos encuentran trabajadores de oficios de la zona y los
          contactan directamente por WhatsApp. <strong className="text-nieve">No somos
          parte del trabajo que se contrata.</strong> No empleamos a los prestadores, no fijamos sus
          precios, no supervisamos sus tareas y no garantizamos resultados.
        </p>
        <p>
          El acuerdo por un trabajo es entre el cliente y el prestador. Los reclamos por el
          trabajo hecho, por daños o por incumplimientos se dirimen entre ellos.
        </p>
      </Section>

      <Section title="Trabajos y presupuestos">
        <p>
          Los clientes pueden publicar lo que necesitan (rubro, zona y detalle) sin crear una
          cuenta. Los prestadores eligen si quieren cotizar un pedido: <strong className="text-nieve">Oficio
          no asigna trabajos</strong>. Cuando un presupuesto se acepta, se muestra el WhatsApp del
          prestador para que las partes coordinen el resto.
        </p>
        <p>
          El presupuesto que enviás es tu propuesta. El cliente decide con quién avanza; el
          trabajo, sus condiciones y su pago se acuerdan siempre entre las partes.
        </p>
      </Section>

      <Section title="Para clientes">
        <p>
          Buscar prestadores y contactarlos es gratis. Antes de contratar, te recomendamos pedir
          presupuesto por escrito, verificar matrícula cuando el oficio la requiera —
          especialmente gas y electricidad — y acordar el alcance del trabajo.
        </p>
        <p>
          El badge ✓ Verificado significa que revisamos un documento de identidad o matrícula.
          No es una garantía sobre la calidad del trabajo ni un aval nuestro.
        </p>
      </Section>

      <Section title="Para prestadores">
        <p>
          Al publicar tu perfil declarás que los datos son verdaderos, que estás habilitado para
          ejercer el oficio que ofrecés y que contás con las matrículas que la normativa exija.
        </p>
        <p>
          Podemos dar de baja un perfil que publique información falsa, que reciba reclamos
          reiterados y fundados, o que use la plataforma para algo distinto de ofrecer sus
          servicios.
        </p>
      </Section>

      <Section title="Suscripciones">
        <p>
          Los planes son mensuales, en pesos argentinos, y se cobran por débito automático a
          través de MercadoPago. Podés cancelar cuando quieras desde tu panel: la baja aplica al
          final del período ya pagado, sin reintegro proporcional.
        </p>
        <p>
          Los precios pueden actualizarse por inflación. Avisamos por email antes de aplicar un
          aumento, con al menos un período de anticipación.
        </p>
      </Section>

      <Section title="Contactos de urgencia">
        <p>
          En el servicio de urgencias 24/7, el cliente abona un cargo fijo para acceder al
          contacto directo de un prestador en guardia. Ese cargo paga el acceso al contacto, no
          el trabajo: lo que cobre el prestador por la reparación se acuerda aparte, entre las
          partes.
        </p>
        <p>
          Si el prestador no responde dentro de los 10 minutos, acreditamos el importe para una
          próxima urgencia.
        </p>
      </Section>

      <Section title="Reseñas">
        <p>
          Las reseñas las escriben los clientes y expresan su opinión. Damos de baja las que
          sean insultantes, discriminatorias, falsas o publicadas por competidores. No damos de
          baja una reseña por el solo hecho de ser negativa.
        </p>
      </Section>

      <Section title="Responsabilidad">
        <p>
          Hacemos lo razonable para que la plataforma esté disponible y la información sea
          correcta, pero no garantizamos servicio ininterrumpido ni ausencia de errores. No
          respondemos por daños derivados de trabajos contratados a través de Oficio.
        </p>
      </Section>

      <Section title="Ley aplicable">
        <p>
          Estos términos se rigen por la ley argentina. Las relaciones de consumo quedan
          alcanzadas por la Ley 24.240 de Defensa del Consumidor. Cualquier controversia se
          somete a los tribunales ordinarios de San Martín de los Andes, provincia del Neuquén.
        </p>
      </Section>

      <Section title="Contacto">
        <p>
          Dudas o reclamos: <a className="underline" href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a>.
        </p>
      </Section>

    </LegalLayout>
  )
}
