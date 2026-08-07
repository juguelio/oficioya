import { useState } from 'react'
import { ciudades, rubros } from '@/design-system/tokens'
import { useAdminQueue } from '@/features/admin/hooks'
import { Badge, Card, PageHeader, SectionTitle } from '@/shared/components'
import type { QueueProvider } from '@/features/admin/types'

// ─── AdminVerificationPage — /admin/verificacion ──────────────────────────────
// Reemplaza el "entrar a Supabase, buscar la fila, abrir Storage, armar la URL
// firmada a mano y tocar is_verified". El plan de lanzamiento apunta a ≥15
// prestadores verificados: hacerlo a mano no escala ni a esa cifra.

export function AdminVerificationPage() {
  const { providers, isAdmin, loading, setVerified, abrirDocumento, refetch } = useAdminQueue()
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-noche">
        <PageHeader title="Verificación" />
        <div className="max-w-xl mx-auto pt-20 px-5 space-y-3 animate-pulse">
          <div className="h-24 rounded-lg bg-sombra" />
          <div className="h-24 rounded-lg bg-sombra" />
        </div>
      </div>
    )
  }

  // No admin: no se explica qué hay del otro lado.
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-noche">
        <PageHeader title="Verificación" />
        <div className="max-w-xl mx-auto pt-24 px-5 text-center">
          <p className="font-bold text-base text-nieve mb-1">Esta página no está disponible</p>
          <p className="text-sm text-muted">Si creés que es un error, entrá con la cuenta correcta.</p>
        </div>
      </div>
    )
  }

  const pendientes = providers.filter(p => !p.isVerified)
  const verificados = providers.filter(p => p.isVerified)

  async function alternar(p: QueueProvider) {
    setError(null)
    const ok = await setVerified(p.id, !p.isVerified)
    if (!ok) setError('No pudimos guardar el cambio. Probá de nuevo.')
  }

  return (
    <div className="min-h-screen bg-noche">
      <PageHeader
        title="Verificación"
        right={
          <button
            onClick={refetch}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-line text-muted active:scale-95 transition-all"
          >
            Actualizar
          </button>
        }
      />

      <main className="pt-14 pb-16 max-w-xl mx-auto px-5">
        <div className="pt-6">
          <p className="text-sm text-muted mb-6">
            Revisá los documentos y marcá el badge ✓ Verificado. El badge es el único filtro de
            calidad visible para los clientes: sólo marcalo si viste matrícula y DNI.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#ffb4ab18', color: '#ffb4ab', border: '1px solid #ffb4ab30' }}>
              {error}
            </div>
          )}

          <SectionTitle
            eyebrow={`${pendientes.length} sin verificar`}
            right={<span className="text-xs font-bold text-muted">{verificados.length} listos</span>}
          >
            Pendientes
          </SectionTitle>

          {pendientes.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-sm font-bold text-nieve mb-1">No hay nada para revisar</p>
              <p className="text-xs text-muted">Cuando un prestador active su perfil y suba documentos, aparece acá.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendientes.map(p => (
                <FilaPrestador key={p.id} provider={p} onToggle={alternar} onOpenDoc={abrirDocumento} />
              ))}
            </div>
          )}

          {verificados.length > 0 && (
            <>
              <SectionTitle className="mt-8">Verificados</SectionTitle>
              <div className="space-y-3">
                {verificados.map(p => (
                  <FilaPrestador key={p.id} provider={p} onToggle={alternar} onOpenDoc={abrirDocumento} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── FilaPrestador ────────────────────────────────────────────────────────────

type FilaPrestadorProps = {
  provider:  QueueProvider
  onToggle:  (p: QueueProvider) => void
  onOpenDoc: (path: string) => Promise<string | null>
}

function FilaPrestador({ provider, onToggle, onOpenDoc }: FilaPrestadorProps) {
  const ciudad = ciudades.find(c => c.id === provider.ciudad)?.label ?? provider.ciudad
  const rubro  = rubros.find(r => r.id === provider.rubro)

  async function ver(path: string) {
    const url = await onOpenDoc(path)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-bold text-sm text-nieve truncate">{provider.name}</p>
          <p className="text-xs text-muted">
            {rubro?.icon} {rubro?.label} · {ciudad}
            {provider.whatsappNumber ? ` · ${provider.whatsappNumber}` : ''}
          </p>
        </div>
        <Badge size="xs" variant={provider.isVerified ? 'verified' : 'neutral'}>
          {provider.isVerified ? 'Verificado' : 'Sin verificar'}
        </Badge>
      </div>

      {provider.bio && <p className="text-xs text-muted mb-3 line-clamp-2">{provider.bio}</p>}

      {provider.docs.length === 0 ? (
        <p className="text-xs text-muted mb-3">Todavía no subió documentación.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {provider.docs.map(d => (
            <button
              key={d.path}
              onClick={() => ver(d.path)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-line text-bosque-lt active:scale-95 transition-all"
            >
              {nombreDoc(d.path)}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => onToggle(provider)}
        disabled={provider.docs.length === 0 && !provider.isVerified}
        className="w-full py-2.5 rounded-full text-sm font-bold active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={
          provider.isVerified
            ? { border: '1px solid var(--color-line)', color: 'var(--color-muted)' }
            : { backgroundColor: 'var(--color-bosque-lt)', color: '#fff' }
        }
      >
        {provider.isVerified
          ? 'Quitar verificación'
          : provider.docs.length === 0
            ? 'Sin documentos para revisar'
            : 'Marcar como verificado'}
      </button>
    </Card>
  )
}

// El nombre del archivo trae la carpeta del usuario y un timestamp: para revisar
// sólo importa qué documento es.
function nombreDoc(path: string): string {
  const archivo = path.split('/').pop() ?? path
  if (archivo.startsWith('dni-frente'))  return 'DNI frente'
  if (archivo.startsWith('dni-dorso'))   return 'DNI dorso'
  if (archivo.startsWith('matricula'))   return 'Matrícula'
  if (archivo.startsWith('foto'))        return 'Foto trabajando'
  if (archivo.startsWith('dni'))         return 'DNI'
  return archivo
}
