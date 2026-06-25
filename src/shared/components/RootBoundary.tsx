import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Button } from '@/shared/components/Button'

// errorElement del router: atrapa cualquier excepción de render/loader (chunk que no carga,
// componente que tira, etc.) y muestra una pantalla branded en vez de la de dev de React Router
// ("Unexpected Application Error / Hey developer"), que NO debe verse nunca en producción.
export function RootBoundary() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  const title = is404 ? 'No encontramos esta página' : 'Se nos rompió algo'
  const body = is404
    ? 'El enlace que seguiste no existe o se mudó de lugar.'
    : 'Tuvimos un problema cargando esta página. Probá de nuevo en un momento.'

  // Detalle del error sólo en desarrollo — en prod no filtramos stack traces.
  const detail = import.meta.env.DEV
    ? (isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : error instanceof Error
          ? error.message
          : String(error))
    : null

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5 px-8 text-center"
      style={{ backgroundColor: 'var(--color-noche)' }}
    >
      <span className="text-5xl">{is404 ? '🧭' : '⚠️'}</span>
      <div className="space-y-2">
        <h1 className="font-black text-2xl" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.03em' }}>
          {title}
        </h1>
        <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          {body}
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {!is404 && (
          <Button size="full" onClick={() => window.location.reload()}>Reintentar</Button>
        )}
        <Button
          size="full"
          variant={is404 ? 'primary' : 'secondary'}
          onClick={() => window.location.assign('/')}
        >
          Volver al inicio
        </Button>
      </div>
      {detail && (
        <pre
          className="mt-2 max-w-xs overflow-auto rounded-[--radius-md] p-3 text-left text-[11px]"
          style={{ backgroundColor: 'var(--color-sombra)', color: 'var(--color-muted)' }}
        >
          {detail}
        </pre>
      )}
    </div>
  )
}
