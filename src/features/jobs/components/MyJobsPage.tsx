import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ciudades, rubros } from '@/design-system/tokens'
import { useMyJobs } from '@/features/jobs/hooks'
import { useAuth } from '@/hooks/useAuth'
import { Logo, Footer } from '@/shared/components'
import type { JobStatus } from '@/features/jobs/types'

const STATUS_LABEL: Record<JobStatus, string> = {
  open:        'Recibiendo presupuestos',
  in_progress: 'Prestador elegido',
  closed:      'Cerrado',
}

// ─── MyJobsPage — /mis-trabajos ───────────────────────────────────────────────
// El panel del CLIENTE. /dashboard es el del prestador; antes era el único
// destino de "Mi panel" y a un cliente lo mandaba al onboarding de alta.

export function MyJobsPage() {
  const navigate = useNavigate()
  const { user, signOut, setAccountType } = useAuth()
  const { jobs, loading } = useMyJobs()

  // Quien llega acá con Google (alta de cliente) todavía no tiene declarado a qué
  // vino: se marca la cuenta como cliente para que el header y /dashboard dejen de
  // tratarla como prestador.
  useEffect(() => {
    const declarado = (user?.user_metadata as { account_type?: string } | undefined)?.account_type
    if (user && !declarado) void setAccountType('cliente')
  }, [user, setAccountType])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-noche)' }}>

      <header
        className="fixed top-0 w-full z-50 h-14 border-b"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <div className="px-5 h-full flex items-center justify-between">
          <button onClick={() => navigate('/')} className="active:scale-95 transition-transform" aria-label="Inicio">
            <Logo size={26} withWordmark />
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border active:scale-95 transition-all"
            style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
          >
            Salir
          </button>
        </div>
      </header>

      <main className="pt-14 pb-16 max-w-xl mx-auto">
        <div className="px-5 pt-6">
          <h1 className="font-black text-2xl mb-1" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.03em' }}>
            Mis trabajos
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
            Seguí los presupuestos que te mandan los prestadores de la zona.
          </p>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-24 rounded-xl" style={{ backgroundColor: 'var(--color-sombra)' }} />
              <div className="h-24 rounded-xl" style={{ backgroundColor: 'var(--color-sombra)' }} />
            </div>
          ) : jobs.length === 0 ? (
            <div
              className="flex flex-col items-center py-12 rounded-xl border text-center"
              style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
            >
              <span className="text-4xl mb-3">📋</span>
              <p className="font-bold text-base mb-1" style={{ color: 'var(--color-nieve)' }}>
                Todavía no publicaste ningún trabajo
              </p>
              <p className="text-sm mb-5 px-6" style={{ color: 'var(--color-muted)' }}>
                Contá qué necesitás y recibí presupuestos de prestadores de tu zona.
              </p>
              <Link
                to="/trabajos/nuevo"
                className="px-5 py-3 rounded-[--radius-full] font-bold text-sm text-white active:scale-[0.98] transition-all"
                style={{ backgroundColor: 'var(--color-bosque-lt)' }}
              >
                Publicar un trabajo
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {jobs.map(job => {
                  const rubroData  = rubros.find(r => r.id === job.rubro)
                  const ciudadData = ciudades.find(c => c.id === job.ciudad)
                  return (
                    <button
                      key={job.id}
                      onClick={() => navigate(`/trabajos/${job.id}#t=${job.clientToken}`)}
                      className="w-full text-left p-4 rounded-xl border active:scale-[0.99] transition-all"
                      style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <p className="font-bold text-sm flex-1" style={{ color: 'var(--color-nieve)' }}>
                          {job.title}
                        </p>
                        {job.quoteCount > 0 && (
                          <span
                            className="text-xs font-black px-2 py-0.5 rounded-full shrink-0 text-white"
                            style={{ backgroundColor: 'var(--color-bosque-lt)', fontFamily: 'var(--font-mono)' }}
                          >
                            {job.quoteCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
                        {rubroData?.icon} {rubroData?.label} · {ciudadData?.label}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded"
                          style={{
                            backgroundColor: job.status === 'open' ? 'var(--color-brand-tint)' : 'rgba(0,0,0,0.04)',
                            color: job.status === 'open' ? 'var(--color-bosque-lt)' : 'var(--color-muted)',
                          }}
                        >
                          {STATUS_LABEL[job.status]}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                          {new Date(job.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <Link
                to="/trabajos/nuevo"
                className="mt-5 flex items-center justify-center w-full py-3.5 rounded-[--radius-full] font-bold text-sm text-white active:scale-[0.98] transition-all"
                style={{ backgroundColor: 'var(--color-bosque-lt)' }}
              >
                Publicar otro trabajo
              </Link>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
