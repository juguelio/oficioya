import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/Button'

// Catch-all (ruta '*'): URL que no existe. Pantalla branded en vez del error crudo de React Router.
export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5 px-8 text-center"
      style={{ backgroundColor: 'var(--color-noche)' }}
    >
      <span className="text-5xl">🧭</span>
      <div className="space-y-2">
        <h1 className="font-black text-2xl" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.03em' }}>
          No encontramos esta página
        </h1>
        <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          El enlace que seguiste no existe o se mudó de lugar. Probá desde el inicio.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button size="full" onClick={() => navigate('/')}>Volver al inicio</Button>
        <Button size="full" variant="secondary" onClick={() => navigate('/emergencias')}>Ver urgencias</Button>
      </div>
    </div>
  )
}
