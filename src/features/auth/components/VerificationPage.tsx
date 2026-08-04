import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/shared/utils/cn'
import { Badge, PageHeader } from '@/shared/components'

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = 'pending' | 'uploaded'

type DocCard = {
  id: 'matricula' | 'dni-frente' | 'dni-dorso' | 'foto'
  title: string
  subtitle: string
  icon: React.ReactNode
  required: boolean
}

// ─── VerificationPage ─────────────────────────────────────────────────────────

export function VerificationPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, UploadStatus>>({
    'matricula':  'pending',
    'dni-frente': 'pending',
    'dni-dorso':  'pending',
    'foto':       'pending',
  })

  // Con "Confirm email" activo, el alta con email llega acá SIN sesión (falta
  // confirmar el mail). Sin sesión no se puede subir nada a provider-docs, así
  // que se avisa y se bloquean las subidas — antes esta pantalla marcaba
  // "Subido ✓" sin subir nada, y los documentos se perdían en silencio.
  const sinSesion = !loading && !user

  const cards: DocCard[] = [
    {
      id:       'matricula',
      title:    'Matrícula o habilitación',
      subtitle: 'Foto clara del documento vigente',
      icon:     <IconDocument />,
      required: true,
    },
    {
      id:       'dni-frente',
      title:    'DNI — frente',
      subtitle: 'Foto clara del frente del documento',
      icon:     <IconBadge />,
      required: true,
    },
    {
      id:       'dni-dorso',
      title:    'DNI — dorso',
      subtitle: 'Foto clara del dorso del documento',
      icon:     <IconBadge />,
      required: true,
    },
    {
      id:       'foto',
      title:    'Foto trabajando',
      subtitle: 'Opcional pero recomendada',
      icon:     <IconCamera />,
      required: false,
    },
  ]

  const requiredUploaded = cards
    .filter(c => c.required)
    .every(c => status[c.id] === 'uploaded')

  async function handleUpload(id: string, file: File) {
    setUploadError(null)

    if (!user) {
      setUploadError('Todavía no confirmaste tu cuenta. Buscá el mail que te mandamos, tocá el link y entrá con tu email y contraseña — recién ahí se guardan tus documentos.')
      return
    }

    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${id}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('provider-docs')
      .upload(path, file, { contentType: file.type, upsert: true })

    if (error) {
      setUploadError(`No pudimos subir el archivo. Probá de nuevo en un momento.`)
      return
    }

    setStatus(prev => ({ ...prev, [id]: 'uploaded' }))
  }

  function handleSubmit() {
    navigate('/')
  }

  return (
    <div className="min-h-screen pb-32 text-nieve bg-noche">

      <PageHeader
        title="Verificá tu perfil"
        right={<span className="text-xs font-semibold text-muted">Paso 2 de 2</span>}
      />

      <main className="pt-20 px-6 max-w-md mx-auto">

        {/* ── Celebration header ────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center mb-10">
          <div className="relative mb-6">
            <div
              className="relative p-6 rounded-full border border-line bg-sombra"
            >
              <IconCheckCircle />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2 tracking-tight text-nieve">
            ¡Tu perfil está listo!
          </h2>
          <p className="text-sm text-muted mb-8 leading-relaxed px-4">
            Subí tu documentación para obtener el badge verificado.
          </p>

          {/* Badge preview */}
          <div
            className="px-5 py-3 rounded-lg flex items-center gap-3 border border-line bg-sombra"
          >
            <div
              className="p-1.5 rounded-full bg-bosque-lt"
            >
              <IconVerified />
            </div>
            <span
              className="font-bold text-sm tracking-wide text-bosque-lt"
            >
              ✓ Verificado
            </span>
          </div>
        </section>

        {/* ── Aviso sin sesión ──────────────────────────────────────────────────── */}
        {sinSesion && (
          <section
            className="mb-6 px-5 py-4 rounded-xl border text-left bg-brand-tint border-bosque-lt"
          >
            <p className="text-sm font-semibold leading-relaxed text-bosque-lt">
              Te mandamos un mail para confirmar tu cuenta. Confirmalo, iniciá sesión
              y volvé acá (o al panel) para subir tu documentación.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-3 px-4 py-2 rounded-full text-sm font-bold text-white active:scale-95 transition-all bg-bosque-lt"
            >
              Ya confirmé — iniciar sesión
            </button>
          </section>
        )}

        {/* ── Upload cards ──────────────────────────────────────────────────────── */}
        <section className="space-y-4 mb-12">
          {cards.map(card => (
            <UploadCard
              key={card.id}
              card={card}
              status={status[card.id]}
              disabled={sinSesion}
              onUpload={file => handleUpload(card.id, file)}
            />
          ))}
        </section>

        {/* ── Bottom actions ────────────────────────────────────────────────────── */}
        <div className="space-y-4 text-center">
          {uploadError && (
            <div
              className="px-4 py-3 rounded-lg text-sm font-semibold text-left"
              style={{ backgroundColor: '#ffb4ab18', color: '#ffb4ab', border: '1px solid #ffb4ab30' }}
            >
              {uploadError}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!requiredUploaded}
            className={cn(
              'w-full py-4 rounded-full font-bold transition-all',
              requiredUploaded
                ? 'active:scale-95'
                : 'cursor-not-allowed opacity-40',
            )}
            style={requiredUploaded ? {
              backgroundColor: 'var(--color-bosque-lt)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
            } : {
              backgroundColor: 'var(--color-sombra)',
              color: 'var(--color-muted)',
              fontSize: '1rem',
            }}
          >
            Enviar para revisión
          </button>

          <button
            onClick={() => navigate('/')}
            className="block w-full text-sm font-bold hover:underline transition-colors text-bosque-lt"
          >
            Hacerlo más tarde
          </button>

          <div className="flex items-center justify-center gap-2 pt-4 opacity-60">
            <IconClock />
            <p className="text-[10px] tracking-wide uppercase text-muted">
              La revisión tarda 24-48hs. Te avisamos por WhatsApp.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}

// ─── UploadCard ───────────────────────────────────────────────────────────────

type UploadCardProps = {
  card: DocCard
  status: UploadStatus
  disabled?: boolean
  onUpload: (file: File) => void
}

function UploadCard({ card, status, disabled, onUpload }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploaded = status === 'uploaded'

  return (
    <div
      className="p-5 rounded-xl transition-colors group border border-line bg-sombra"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-lg transition-colors border border-line"
            style={{
              backgroundColor: 'var(--color-noche)',
              color: uploaded ? 'var(--color-bosque-lt)' : 'var(--color-nieve)',
            }}
          >
            {card.icon}
          </div>
          <div>
            <h3 className="font-bold text-nieve">
              {card.title}
            </h3>
            <p className="text-xs text-muted">{card.subtitle}</p>
          </div>
        </div>

        {/* Status badge */}
        {uploaded ? (
          <Badge size="xs" variant="verified">Subido ✓</Badge>
        ) : card.required ? (
          <Badge size="xs" variant="neutral">Pendiente</Badge>
        ) : (
          <Badge size="xs" variant="tint">Opcional</Badge>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={cn(
          'w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 border',
          'active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed',
          uploaded ? 'border-bosque-lt/40' : 'border-line',
        )}
        style={{
          backgroundColor: 'var(--color-noche)',
          color: uploaded ? 'var(--color-bosque-lt)' : 'var(--color-nieve)',
        }}
      >
        {uploaded ? <IconCheck /> : <IconCamera size={18} />}
        {uploaded ? 'Reemplazar' : 'Subir foto'}
      </button>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheckCircle() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-bosque-lt">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
      <path d="M9 12l2 2 4-4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
    </svg>
  )
}

function IconVerified() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: '#fff' }}>
      <path d="M9 12l2 2 4-4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconDocument() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconBadge() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M15 8h2M15 12h2M7 16h10" />
    </svg>
  )
}

function IconCamera({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
