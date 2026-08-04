import { useNavigate } from 'react-router-dom'
import { Logo } from '@/shared/components/Logo'
import { cn } from '@/shared/utils/cn'

type PageHeaderProps = {
  /** Título a la izquierda. Si se omite, se muestra el logo (y lleva al inicio). */
  title?: string
  /** Mostrar la flecha de volver. Default: true. */
  back?: boolean
  /** Contenido del extremo derecho (botón de salir, chip de plan, etc.). */
  right?: React.ReactNode
  className?: string
}

// Barra superior fija. UNA sola en toda la app: antes cada pantalla tenía la suya
// (h-14 vs h-16 vs py-4, fondo crema vs blanco, con logo o sin logo), y eso solo
// ya hacía que navegar entre secciones se sintiera como cambiar de aplicación.
// El `main` de la página tiene que compensar con `pt-14`.
export function PageHeader({ title, back = true, right, className }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header
      className={cn('fixed top-0 w-full z-50 h-14 border-b bg-sombra border-line', className)}
    >
      <div className="px-5 h-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {back && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-md text-bosque-lt transition-all active:scale-95"
              aria-label="Volver"
            >
              <IconArrowLeft />
            </button>
          )}
          {title ? (
            <h1
              className="font-bold text-base text-nieve truncate"
              style={{ letterSpacing: '-0.02em' }}
            >
              {title}
            </h1>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="active:scale-95 transition-transform"
              aria-label="Inicio"
            >
              <Logo size={26} withWordmark />
            </button>
          )}
        </div>
        {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
      </div>
    </header>
  )
}

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}
