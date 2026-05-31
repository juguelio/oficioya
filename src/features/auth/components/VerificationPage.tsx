import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/shared/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = 'pending' | 'uploaded'

type DocCard = {
  id: 'matricula' | 'dni' | 'foto'
  title: string
  subtitle: string
  icon: React.ReactNode
  required: boolean
}

// ─── VerificationPage ─────────────────────────────────────────────────────────

export function VerificationPage() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, UploadStatus>>({
    matricula: 'pending',
    dni:       'pending',
    foto:      'pending',
  })

  const cards: DocCard[] = [
    {
      id:       'matricula',
      title:    'Matrícula o habilitación',
      subtitle: 'Foto clara del documento vigente',
      icon:     <IconDocument />,
      required: true,
    },
    {
      id:       'dni',
      title:    'DNI',
      subtitle: 'Frente y dorso',
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
      setStatus(prev => ({ ...prev, [id]: 'uploaded' }))
      return
    }

    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${id}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('provider-docs')
      .upload(path, file, { contentType: file.type, upsert: true })

    if (error) {
      setUploadError(`Error al subir ${id}: ${error.message}`)
      return
    }

    setStatus(prev => ({ ...prev, [id]: 'uploaded' }))
  }

  function handleSubmit() {
    navigate('/')
  }

  return (
    <div className="min-h-screen pb-32 text-[--color-nieve]" style={{ backgroundColor: 'var(--color-noche)' }}>

      {/* ── TopAppBar ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 border-b border-[--color-line]"
        style={{ backgroundColor: 'var(--color-noche)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="active:scale-95 transition-transform text-[--color-bosque-lt]"
            aria-label="Volver"
          >
            <IconArrowLeft />
          </button>
          <h1 className="font-bold text-lg tracking-tight text-[--color-bosque-lt]">
            Verificá tu perfil
          </h1>
        </div>
        <span className="text-sm font-bold text-[--color-nieve] opacity-80">
          Paso 2 de 2
        </span>
      </nav>

      <main className="pt-24 px-6 max-w-md mx-auto">

        {/* ── Celebration header ────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center mb-10">
          <div className="relative mb-6">
            <div
              className="relative p-6 rounded-full border border-[--color-line]"
              style={{ backgroundColor: 'var(--color-sombra)' }}
            >
              <IconCheckCircle />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2 tracking-tight text-[--color-nieve]">
            ¡Tu perfil está listo!
          </h2>
          <p className="text-sm text-[--color-muted] mb-8 leading-relaxed px-4">
            Subí tu documentación para obtener el badge verificado.
          </p>

          {/* Badge preview */}
          <div
            className="px-5 py-3 rounded-xl flex items-center gap-3 border border-[--color-line]"
            style={{ backgroundColor: 'var(--color-sombra)' }}
          >
            <div
              className="p-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-bosque-lt)' }}
            >
              <IconVerified />
            </div>
            <span
              className="font-bold text-sm tracking-wide"
              style={{ color: 'var(--color-bosque-lt)' }}
            >
              ✓ Verificado
            </span>
          </div>
        </section>

        {/* ── Upload cards ──────────────────────────────────────────────────────── */}
        <section className="space-y-4 mb-12">
          {cards.map(card => (
            <UploadCard
              key={card.id}
              card={card}
              status={status[card.id]}
              onUpload={file => handleUpload(card.id, file)}
            />
          ))}
        </section>

        {/* ── Bottom actions ────────────────────────────────────────────────────── */}
        <div className="space-y-4 text-center">
          {uploadError && (
            <div
              className="px-4 py-3 rounded-xl text-sm font-semibold text-left"
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
            className="block w-full text-sm font-bold hover:underline transition-colors"
            style={{ color: 'var(--color-bosque-lt)' }}
          >
            Hacerlo más tarde
          </button>

          <div className="flex items-center justify-center gap-2 pt-4 opacity-60">
            <IconClock />
            <p className="text-[10px] tracking-wide uppercase text-[--color-muted]">
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
  onUpload: (file: File) => void
}

function UploadCard({ card, status, onUpload }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploaded = status === 'uploaded'

  return (
    <div
      className="p-5 rounded-2xl transition-colors group border border-[--color-line]"
      style={{ backgroundColor: 'var(--color-sombra)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-xl transition-colors border border-[--color-line]"
            style={{
              backgroundColor: 'var(--color-noche)',
              color: uploaded ? 'var(--color-bosque-lt)' : 'var(--color-nieve)',
            }}
          >
            {card.icon}
          </div>
          <div>
            <h3 className="font-bold text-[--color-nieve]">
              {card.title}
            </h3>
            <p className="text-xs text-[--color-muted]">{card.subtitle}</p>
          </div>
        </div>

        {/* Status badge */}
        {uploaded ? (
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded"
            style={{ color: '#fff', backgroundColor: 'var(--color-bosque-lt)' }}
          >
            Subido ✓
          </span>
        ) : card.required ? (
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded"
            style={{ color: 'var(--color-muted)', backgroundColor: 'var(--color-noche)' }}
          >
            Pendiente
          </span>
        ) : (
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded"
            style={{ color: '#fff', backgroundColor: 'var(--color-bosque-lt)' }}
          >
            Opcional
          </span>
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
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border',
          'active:scale-[0.98] transition-all',
          uploaded ? 'border-[--color-bosque-lt]/40' : 'border-[--color-line]',
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

function IconArrowLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function IconCheckCircle() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--color-bosque-lt)' }}>
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
