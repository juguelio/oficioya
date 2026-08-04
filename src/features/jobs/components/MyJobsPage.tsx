import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ciudades, rubros } from '@/design-system/tokens'
import { useMyJobs } from '@/features/jobs/hooks'
import { useAuth } from '@/hooks/useAuth'
import { Badge, Footer, PageHeader } from '@/shared/components'
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
    <div className="min-h-screen bg-noche">

      <PageHeader
        back={false}
        right={
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border active:scale-95 transition-all border-line text-muted"
          >
            Salir
          </button>
        }
      />

      <main className="pt-14 pb-16 max-w-xl mx-auto">
        <div className="px-5 pt-6">
          <h1 className="font-black text-2xl mb-1" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.03em' }}>
            Mis trabajos
          </h1>
          <p className="text-sm mb-6 text-muted">
            Seguí los presupuestos que te mandan los prestadores de la zona.
          </p>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-24 rounded-lg bg-sombra" />
              <div className="h-24 rounded-lg bg-sombra" />
            </div>
          ) : jobs.length === 0 ? (
            <div
              className="flex flex-col items-center py-12 rounded-lg border text-center bg-sombra border-line"
            >
              <span className="text-4xl mb-3">📋</span>
              <p className="font-bold text-base mb-1 text-nieve">
                Todavía no publicaste ningún trabajo
              </p>
              <p className="text-sm mb-5 px-6 text-muted">
                Contá qué necesitás y recibí presupuestos de prestadores de tu zona.
              </p>
              <Link
                to="/trabajos/nuevo"
                className="px-5 py-3 rounded-full font-bold text-sm text-white active:scale-[0.98] transition-all bg-bosque-lt"
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
                      className="w-full text-left p-4 rounded-lg border active:scale-[0.99] transition-all bg-sombra border-line"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <p className="font-bold text-sm flex-1 text-nieve">
                          {job.title}
                        </p>
                        {job.quoteCount > 0 && (
                          <Badge variant="verified" className="shrink-0" >{job.quoteCount}</Badge>
                        )}
                      </div>
                      <p className="text-xs mb-2 text-muted">
                        {rubroData?.icon} {rubroData?.label} · {ciudadData?.label}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge size="xs" variant={job.status === 'open' ? 'tint' : 'neutral'}>
                          {STATUS_LABEL[job.status]}
                        </Badge>
                        <span className="text-[10px] text-muted">
                          {new Date(job.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <Link
                to="/trabajos/nuevo"
                className="mt-5 flex items-center justify-center w-full py-3.5 rounded-full font-bold text-sm text-white active:scale-[0.98] transition-all bg-bosque-lt"
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
