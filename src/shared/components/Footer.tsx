import { Link } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'

export const CONTACTO_EMAIL = 'hola@oficioya.app'

// Quién está atrás. No es decoración: el prestador al que llamamos por teléfono
// y le mandamos un link por WhatsApp va a entrar acá justamente a chequear que
// no lo estén estafando. Un sitio que dice "somos una plataforma" y firma con un
// mail genérico se parece demasiado a lo que esa persona está tratando de evitar.
// Un nombre y un pueblo son verificables: acá se pregunta y se sabe.
export const FUNDADOR = 'Joaquín Apóstolo'
export const FUNDADOR_CIUDAD = 'San Martín de los Andes'

/**
 * Footer del sitio público.
 *
 * El bloque de redes está armado pero NO se renderiza: Oficio todavía no tiene
 * cuentas. Un icono de Instagram que lleva a la nada es peor que no tenerlo —
 * cuando existan, se completan las URLs en REDES y aparece solo.
 */
const REDES: { label: string; url: string | null; icon: () => JSX.Element }[] = [
  { label: 'Instagram', url: null, icon: IconInstagram },
  { label: 'Facebook',  url: null, icon: IconFacebook },
]

function IconInstagram() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h3l.5-4H12V7.5A1.5 1.5 0 0 1 13.5 6H15z" />
    </svg>
  )
}

type FooterProps = { className?: string }

export function Footer({ className }: FooterProps) {
  const redesActivas = REDES.filter(r => r.url)

  return (
    <footer
      className={cn('w-full border-t mt-16 border-line bg-sombra', className)}
    >
      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="flex flex-col sm:flex-row sm:justify-between gap-8">

          <div className="max-w-xs">
            <p className="font-black text-base mb-2" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
              Oficio
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Los oficios de San Martín y Junín de los Andes, en un solo lugar.
              Contacto directo por WhatsApp, sin intermediarios.
            </p>
            <p className="text-sm leading-relaxed mt-3 text-muted">
              Lo armó <strong className="text-nieve font-semibold">{FUNDADOR}</strong>, de {FUNDADOR_CIUDAD}.
              Si te escribimos y querés chequear que somos de verdad, respondenos
              a <a className="underline" href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a>.
            </p>
          </div>

          <nav className="flex flex-col gap-2.5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1 text-muted">
              Plataforma
            </p>
            <FooterLink to="/emergencias">Urgencias 24/7</FooterLink>
            <FooterLink to="/trabajos">Trabajos publicados</FooterLink>
            <FooterLink to="/planes">Planes para prestadores</FooterLink>
            <FooterLink to="/registro/prestador">Sumate como prestador</FooterLink>
          </nav>

          <nav className="flex flex-col gap-2.5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1 text-muted">
              Legales
            </p>
            <FooterLink to="/privacidad">Política de privacidad</FooterLink>
            <FooterLink to="/terminos">Términos y condiciones</FooterLink>
            <a
              href={`mailto:${CONTACTO_EMAIL}`}
              className="text-sm transition-colors hover:underline text-muted"
            >
              {CONTACTO_EMAIL}
            </a>
          </nav>
        </div>

        {redesActivas.length > 0 && (
          <div className="flex gap-4 mt-8">
            {redesActivas.map(r => (
              <a
                key={r.label}
                href={r.url!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={r.label}
                className="transition-colors text-muted"
              >
                <r.icon />
              </a>
            ))}
          </div>
        )}

        <p className="text-xs mt-8 pt-6 border-t text-muted border-line">
          © {new Date().getFullYear()} Oficio · San Martín de los Andes, Neuquén, Argentina
        </p>
      </div>
    </footer>
  )
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm transition-colors hover:underline text-muted">
      {children}
    </Link>
  )
}
