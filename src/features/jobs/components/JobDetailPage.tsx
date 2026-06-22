import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { rubros } from '@/design-system/tokens'
import { useJobTracking, useProviderJobView } from '@/features/jobs/hooks'
import { formatARS } from '@/shared/utils/formatARS'
import { cn } from '@/shared/utils/cn'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { TrackedQuote } from '@/features/jobs/hooks'

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60)  return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

const RUBRO_MAP = Object.fromEntries(rubros.map(r => [r.id, r]))
const STATUS_LABEL: Record<string, string> = { open: 'Abierto', in_progress: 'En proceso', closed: 'Cerrado' }
const STATUS_COLOR: Record<string, string> = { open: 'var(--color-bosque-lt)', in_progress: '#E8A020', closed: 'var(--color-muted)' }

// ─── Router: cliente (con token) vs prestador ─────────────────────────────────

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  // El token va en el fragment (#t=...), no en la query: el fragment no viaja al
  // server (Referer/logs) ni a PostHog. Ver fix de seguridad IDOR.
  const { hash } = useLocation()
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('t')

  if (token) return <ClientJobView token={token} />
  return <ProviderJobView jobId={id ?? ''} />
}

// ─── Vista del cliente (seguimiento por token) ────────────────────────────────

function ClientJobView({ token }: { token: string }) {
  const navigate = useNavigate()
  const { job, quotes, loading, accept } = useJobTracking(token)
  const [confirmQuoteId, setConfirmQuoteId] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  if (loading) return <CenterMsg text="Cargando…" />
  if (!job)    return <CenterMsg text="No encontramos este trabajo. Revisá tu link." />

  const isOpen = job.status === 'open'

  async function handleAccept(quoteId: string) {
    setAccepting(true)
    await accept(quoteId)
    setAccepting(false)
    setConfirmQuoteId(null)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-noche)' }}>
      <JobHeader title={job.title} status={job.status} onBack={() => navigate('/')} />

      <main className="pt-14 pb-10">
        <JobInfo job={job} />

        <section className="px-5 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-base" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
              Presupuestos recibidos
            </h2>
            <span
              className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-lt)', fontFamily: 'var(--font-mono)' }}
            >
              {quotes.length}
            </span>
          </div>

          {quotes.length === 0 ? (
            <EmptyBox icon="💬" title="Sin presupuestos aún" body="Cuando un prestador te envíe una propuesta, la vas a ver acá." />
          ) : (
            <div className="space-y-3">
              {quotes.map(q => (
                <QuoteCard key={q.id} quote={q} isOpen={isOpen} onAccept={() => setConfirmQuoteId(q.id)} />
              ))}
            </div>
          )}
        </section>
      </main>

      {confirmQuoteId && (() => {
        const q = quotes.find(x => x.id === confirmQuoteId)!
        return (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="w-full max-w-xs rounded-2xl p-6" style={{ backgroundColor: 'var(--color-sombra)' }}>
              <p className="font-black text-base mb-2" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.01em' }}>
                ¿Aceptar este presupuesto?
              </p>
              <p className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>
                <strong style={{ color: 'var(--color-nieve)' }}>{q.providerName}</strong> — {formatARS(q.amount)}
              </p>
              <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
                Los otros quedarán descartados y se te mostrará el WhatsApp del prestador.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmQuoteId(null)}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold border active:scale-95 transition-all"
                  style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleAccept(confirmQuoteId)}
                  disabled={accepting}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold text-white active:scale-95 transition-all disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-bosque-lt)' }}
                >
                  {accepting ? 'Aceptando…' : 'Sí, aceptar'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Vista del prestador (ofertar) ────────────────────────────────────────────

const quoteSchema = z.object({
  amount:        z.coerce.number().min(1000, 'El monto mínimo es $1.000'),
  message:       z.string().min(20, 'Escribí un mensaje explicando tu propuesta'),
  estimatedDays: z.coerce.number().optional(),
})
type QuoteFormData = z.infer<typeof quoteSchema>

function ProviderJobView({ jobId }: { jobId: string }) {
  const navigate = useNavigate()
  const { job, provider, myQuoteStatus, loading, submitQuote } = useProviderJobView(jobId)
  const [showSheet, setShowSheet] = useState(false)
  const [sent, setSent] = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<QuoteFormData>({ resolver: zodResolver(quoteSchema) })

  if (loading) return <CenterMsg text="Cargando…" />
  if (!job)    return <CenterMsg text="Trabajo no encontrado." />

  const isOpen   = job.status === 'open'
  const canQuote = isOpen && provider?.active && !myQuoteStatus

  async function onSubmit(data: QuoteFormData) {
    setSubmitErr(null)
    const ok = await submitQuote(data.amount, data.message, data.estimatedDays || undefined)
    if (!ok) { setSubmitErr('No se pudo enviar el presupuesto. ¿Ya enviaste uno?'); return }
    setShowSheet(false)
    setSent(true)
    reset()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-noche)' }}>
      <JobHeader title={job.title} status={job.status} onBack={() => navigate(-1)} />

      <main className="pt-14 pb-32">
        <JobInfo job={job} />

        <section className="px-5 pt-6">
          {sent ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: 'var(--color-brand-tint)', borderColor: 'var(--color-bosque-lt)' }}>
              <span className="text-xl">✅</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-bosque-lt)' }}>
                ¡Presupuesto enviado! El cliente lo verá en su panel.
              </p>
            </div>
          ) : myQuoteStatus ? (
            <InfoBox title="Ya enviaste un presupuesto" body={`Estado: ${myQuoteStatus === 'accepted' ? 'aceptado 🎉' : myQuoteStatus === 'rejected' ? 'no seleccionado' : 'pendiente de respuesta'}.`} />
          ) : !isOpen ? (
            <InfoBox title="Este trabajo ya no recibe presupuestos" body="El cliente ya eligió o cerró el trabajo." />
          ) : !provider ? (
            <div className="text-center py-6">
              <InfoBox title="Iniciá sesión para ofertar" body="Necesitás tu cuenta de prestador para enviar un presupuesto." />
              <button
                onClick={() => navigate('/login')}
                className="mt-4 px-6 py-3 rounded-full font-bold text-sm text-white active:scale-95 transition-all"
                style={{ backgroundColor: 'var(--color-bosque-lt)' }}
              >
                Iniciar sesión
              </button>
            </div>
          ) : !provider.active ? (
            <InfoBox title="Tu perfil todavía no está activo" body="Completá la verificación para poder enviar presupuestos." />
          ) : null}
        </section>
      </main>

      {canQuote && !sent && (
        <div className="fixed bottom-0 left-0 w-full px-5 py-4 border-t" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
          <button
            onClick={() => setShowSheet(true)}
            className="w-full py-4 rounded-full font-bold text-sm text-white active:scale-[0.98] transition-all"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
            Enviar presupuesto
          </button>
        </div>
      )}

      {showSheet && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowSheet(false)}>
          <div className="rounded-t-2xl px-5 pt-4 pb-8 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-sombra)' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: 'var(--color-line)' }} />
            <h3 className="font-black text-lg mb-4" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>Tu presupuesto</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-muted)' }}>Monto (ARS)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--color-muted)' }}>$</span>
                    <input
                      {...register('amount')}
                      type="number"
                      placeholder="45000"
                      className="w-full h-11 pl-6 pr-3 rounded-xl text-sm focus:outline-none"
                      style={{ backgroundColor: 'var(--color-noche)', border: `1px solid ${errors.amount ? '#ffb4ab' : 'var(--color-line)'}`, color: 'var(--color-nieve)', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  {errors.amount && <p className="text-[10px] mt-0.5" style={{ color: '#ffb4ab' }}>{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-muted)' }}>Días est.</label>
                  <input
                    {...register('estimatedDays')}
                    type="number"
                    placeholder="2"
                    className="w-full h-11 px-3 rounded-xl text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--color-noche)', border: '1px solid var(--color-line)', color: 'var(--color-nieve)', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-muted)' }}>Tu propuesta</label>
                <textarea
                  {...register('message')}
                  rows={3}
                  placeholder="Explicá cómo encarás el trabajo, qué incluye el precio, disponibilidad..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none placeholder:text-[var(--color-muted)]"
                  style={{ backgroundColor: 'var(--color-noche)', border: `1px solid ${errors.message ? '#ffb4ab' : 'var(--color-line)'}`, color: 'var(--color-nieve)' }}
                />
                {errors.message && <p className="text-[10px] mt-0.5" style={{ color: '#ffb4ab' }}>{errors.message.message}</p>}
              </div>
              {submitErr && <p className="text-xs" style={{ color: '#ffb4ab' }}>{submitErr}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full font-bold text-sm text-white active:scale-[0.98] transition-all disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-bosque-lt)' }}
              >
                Enviar presupuesto
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Piezas compartidas ───────────────────────────────────────────────────────

type JobInfoData = {
  rubro: RubroId; title: string; description: string; ciudad: CiudadId
  barrio?: string; authorName: string; createdAt: string; budgetMin?: number; budgetMax?: number
}

function JobHeader({ title, status, onBack }: { title: string; status: string; onBack: () => void }) {
  return (
    <header className="fixed top-0 w-full z-50 flex items-center gap-3 px-5 h-14 border-b" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
      <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-all" style={{ backgroundColor: 'var(--color-noche)' }}>
        <IconBack />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm truncate" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.01em' }}>{title}</p>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0" style={{ color: STATUS_COLOR[status], backgroundColor: 'rgba(0,0,0,0.05)' }}>
        {STATUS_LABEL[status]}
      </span>
    </header>
  )
}

function JobInfo({ job }: { job: JobInfoData }) {
  const rubro = RUBRO_MAP[job.rubro]
  return (
    <section className="px-5 pt-5 pb-5 border-b" style={{ borderColor: 'var(--color-line)' }}>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-lt)' }}>
        {rubro?.icon} {rubro?.label}
      </span>
      <h1 className="font-black text-xl leading-tight mb-3" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>{job.title}</h1>
      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-muted)' }}>{job.description}</p>
      <div className="flex flex-wrap gap-3">
        <MetaChip icon="📍" label={job.barrio ? `${job.barrio}, ${job.ciudad}` : job.ciudad} />
        <MetaChip icon="👤" label={job.authorName} />
        <MetaChip icon="🕐" label={timeAgo(job.createdAt)} />
        {(job.budgetMin || job.budgetMax) && (
          <MetaChip
            icon="💰"
            label={job.budgetMin && job.budgetMax ? `${formatARS(job.budgetMin)} – ${formatARS(job.budgetMax)}` : job.budgetMax ? `hasta ${formatARS(job.budgetMax)}` : `desde ${formatARS(job.budgetMin!)}`}
            mono
          />
        )}
      </div>
    </section>
  )
}

function CenterMsg({ text }: { text: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-8 text-center" style={{ backgroundColor: 'var(--color-noche)' }}>
      <p style={{ color: 'var(--color-muted)' }}>{text}</p>
    </div>
  )
}

function EmptyBox({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center py-10 rounded-xl border text-center" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
      <span className="text-4xl mb-3">{icon}</span>
      <p className="font-bold text-sm mb-1" style={{ color: 'var(--color-nieve)' }}>{title}</p>
      <p className="text-xs px-6" style={{ color: 'var(--color-muted)' }}>{body}</p>
    </div>
  )
}

function InfoBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
      <p className="font-bold text-sm mb-1" style={{ color: 'var(--color-nieve)' }}>{title}</p>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{body}</p>
    </div>
  )
}

// ─── QuoteCard ─────────────────────────────────────────────────────────────────

type QuoteCardProps = { quote: TrackedQuote; isOpen: boolean; onAccept: () => void }

function QuoteCard({ quote, isOpen, onAccept }: QuoteCardProps) {
  const isAccepted = quote.status === 'accepted'
  const isRejected = quote.status === 'rejected'
  return (
    <div className={cn('rounded-xl border overflow-hidden')} style={{ backgroundColor: 'var(--color-sombra)', borderColor: isAccepted ? 'var(--color-bosque-lt)' : 'var(--color-line)', opacity: isRejected ? 0.5 : 1 }}>
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0" style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-lt)' }}>
            {quote.providerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm truncate" style={{ color: 'var(--color-nieve)' }}>{quote.providerName}</p>
              {quote.providerVerified && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-lt)' }}>✓ VER</span>
              )}
            </div>
            {quote.providerRating != null && (
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                <span style={{ color: '#E8A020' }}>★</span>{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>{quote.providerRating.toFixed(1)}</span>
                {quote.estimatedDays && ` · ${quote.estimatedDays}d de trabajo`}
              </p>
            )}
          </div>
          <p className="font-black text-base shrink-0" style={{ color: 'var(--color-nieve)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
            {formatARS(quote.amount)}
          </p>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{quote.message}</p>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t" style={{ borderColor: 'var(--color-line)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
        <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{timeAgo(quote.createdAt)}</span>
        {isAccepted && quote.providerPhone ? (
          <a
            href={`https://wa.me/${quote.providerPhone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white active:scale-95 transition-all"
            style={{ backgroundColor: '#25D366' }}
          >
            <IconWhatsApp /> Contactar
          </a>
        ) : isRejected ? (
          <span className="text-xs font-bold" style={{ color: 'var(--color-muted)' }}>No seleccionado</span>
        ) : isOpen ? (
          <button onClick={onAccept} className="px-3 py-1.5 rounded-full text-xs font-bold text-white active:scale-95 transition-all" style={{ backgroundColor: 'var(--color-bosque-lt)' }}>
            Aceptar
          </button>
        ) : null}
      </div>
    </div>
  )
}

// ─── MetaChip ─────────────────────────────────────────────────────────────────

type MetaChipProps = { icon: string; label: string; mono?: boolean }
function MetaChip({ icon, label, mono = false }: MetaChipProps) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)', color: 'var(--color-muted)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>
      {icon} {label}
    </span>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-nieve)' }}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}
function IconWhatsApp() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  )
}
