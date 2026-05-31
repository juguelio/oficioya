import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { rubros } from '@/design-system/tokens'
import { useJob } from '@/features/jobs/hooks'
import { useJobStore } from '@/features/jobs/store'
import { formatARS } from '@/shared/utils/formatARS'
import { cn } from '@/shared/utils/cn'
import type { Quote } from '@/features/jobs/types'

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60)  return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

const RUBRO_MAP = Object.fromEntries(rubros.map(r => [r.id, r]))

const STATUS_LABEL = { open: 'Abierto', in_progress: 'En proceso', closed: 'Cerrado' }
const STATUS_COLOR = { open: 'var(--color-bosque-lt)', in_progress: '#E8A020', closed: 'var(--color-muted)' }

// ─── Quote form schema ────────────────────────────────────────────────────────

const quoteSchema = z.object({
  providerName:  z.string().min(2, 'Ingresá tu nombre'),
  providerPhone: z.string().min(8, 'Ingresá tu teléfono con código de área'),
  amount:        z.coerce.number().min(1000, 'El monto mínimo es $1.000'),
  message:       z.string().min(20, 'Escribí un mensaje explicando tu propuesta'),
  estimatedDays: z.coerce.number().optional(),
})
type QuoteFormData = z.infer<typeof quoteSchema>

// ─── JobDetailPage ────────────────────────────────────────────────────────────

export function JobDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { job, quotes } = useJob(id ?? '')
  const addQuote    = useJobStore(s => s.addQuote)
  const acceptQuote = useJobStore(s => s.acceptQuote)

  const [showQuoteSheet, setShowQuoteSheet]   = useState(false)
  const [confirmQuoteId, setConfirmQuoteId]   = useState<string | null>(null)
  const [quoteSent, setQuoteSent]             = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<QuoteFormData>({ resolver: zodResolver(quoteSchema) })

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-noche)' }}>
        <p style={{ color: 'var(--color-muted)' }}>Trabajo no encontrado.</p>
      </div>
    )
  }

  const rubro         = RUBRO_MAP[job.rubro]
  const isOpen = job.status === 'open'

  function onSubmitQuote(data: QuoteFormData) {
    addQuote({
      jobId:        job!.id,
      providerName: data.providerName,
      providerPhone: data.providerPhone,
      amount:       data.amount,
      message:      data.message,
      estimatedDays: data.estimatedDays || undefined,
    })
    setShowQuoteSheet(false)
    setQuoteSent(true)
    reset()
  }

  function handleAccept(quoteId: string) {
    acceptQuote(quoteId, job!.id)
    setConfirmQuoteId(null)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-noche)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 w-full z-50 flex items-center gap-3 px-5 h-14 border-b"
        style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-all"
          style={{ backgroundColor: 'var(--color-noche)' }}
        >
          <IconBack />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.01em' }}>
            {job.title}
          </p>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0"
          style={{ color: STATUS_COLOR[job.status], backgroundColor: 'rgba(0,0,0,0.05)' }}
        >
          {STATUS_LABEL[job.status]}
        </span>
      </header>

      <main className="pt-14 pb-32">

        {/* ── Info del trabajo ─────────────────────────────────────────────────── */}
        <section className="px-5 pt-5 pb-5 border-b" style={{ borderColor: 'var(--color-line)' }}>
          {/* Rubro badge */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-lt)' }}
          >
            {rubro?.icon} {rubro?.label}
          </span>

          <h1
            className="font-black text-xl leading-tight mb-3"
            style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}
          >
            {job.title}
          </h1>

          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-muted)' }}>
            {job.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-3">
            <MetaChip icon="📍" label={job.barrio ? `${job.barrio}, ${job.ciudad}` : job.ciudad} />
            <MetaChip icon="👤" label={job.authorName} />
            <MetaChip icon="🕐" label={timeAgo(job.createdAt)} />
            {(job.budgetMin || job.budgetMax) && (
              <MetaChip
                icon="💰"
                label={
                  job.budgetMin && job.budgetMax
                    ? `${formatARS(job.budgetMin)} – ${formatARS(job.budgetMax)}`
                    : job.budgetMax
                    ? `hasta ${formatARS(job.budgetMax)}`
                    : `desde ${formatARS(job.budgetMin!)}`
                }
                mono
              />
            )}
          </div>
        </section>

        {/* ── Presupuestos ─────────────────────────────────────────────────────── */}
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

          {quoteSent && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 border"
              style={{ backgroundColor: 'var(--color-brand-tint)', borderColor: 'var(--color-bosque-lt)' }}
            >
              <span className="text-xl">✅</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-bosque-lt)' }}>
                ¡Presupuesto enviado! El cliente lo recibirá pronto.
              </p>
            </div>
          )}

          {quotes.length === 0 ? (
            <div
              className="flex flex-col items-center py-10 rounded-xl border text-center"
              style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
            >
              <span className="text-4xl mb-3">💬</span>
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--color-nieve)' }}>
                Sin presupuestos aún
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {isOpen ? 'Sé el primero en enviar tu propuesta' : 'No se recibieron presupuestos'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map(q => (
                <QuoteCard
                  key={q.id}
                  quote={q}
                  isOpen={isOpen}
                  onAccept={() => setConfirmQuoteId(q.id)}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* ── CTA fijo — enviar presupuesto ──────────────────────────────────────── */}
      {isOpen && !quoteSent && (
        <div
          className="fixed bottom-0 left-0 w-full px-5 py-4 border-t"
          style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}
        >
          <button
            onClick={() => setShowQuoteSheet(true)}
            className="w-full py-4 rounded-full font-bold text-sm text-white active:scale-[0.98] transition-all"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
            Enviar presupuesto
          </button>
        </div>
      )}

      {/* ── Sheet: Enviar presupuesto ───────────────────────────────────────────── */}
      {showQuoteSheet && (
        <div
          className="fixed inset-0 z-[200] flex flex-col justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowQuoteSheet(false)}
        >
          <div
            className="rounded-t-2xl px-5 pt-4 pb-8 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-sombra)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: 'var(--color-line)' }} />
            <h3 className="font-black text-lg mb-4" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>
              Tu presupuesto
            </h3>
            <form onSubmit={handleSubmit(onSubmitQuote)} className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-muted)' }}>Tu nombre</label>
                  <input
                    {...register('providerName')}
                    placeholder="Rodolfo A."
                    className="w-full h-11 px-3 rounded-xl text-sm focus:outline-none placeholder:text-[var(--color-muted)]"
                    style={{ backgroundColor: 'var(--color-noche)', border: `1px solid ${errors.providerName ? '#ffb4ab' : 'var(--color-line)'}`, color: 'var(--color-nieve)' }}
                  />
                  {errors.providerName && <p className="text-[10px] mt-0.5" style={{ color: '#ffb4ab' }}>{errors.providerName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-muted)' }}>Tu teléfono</label>
                  <input
                    {...register('providerPhone')}
                    placeholder="+549 2972..."
                    type="tel"
                    className="w-full h-11 px-3 rounded-xl text-sm focus:outline-none placeholder:text-[var(--color-muted)]"
                    style={{ backgroundColor: 'var(--color-noche)', border: `1px solid ${errors.providerPhone ? '#ffb4ab' : 'var(--color-line)'}`, color: 'var(--color-nieve)' }}
                  />
                  {errors.providerPhone && <p className="text-[10px] mt-0.5" style={{ color: '#ffb4ab' }}>{errors.providerPhone.message}</p>}
                </div>
              </div>

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

      {/* ── Confirm accept dialog ───────────────────────────────────────────────── */}
      {confirmQuoteId && (() => {
        const q = quotes.find(x => x.id === confirmQuoteId)!
        return (
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center px-6"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <div className="w-full max-w-xs rounded-2xl p-6" style={{ backgroundColor: 'var(--color-sombra)' }}>
              <p className="font-black text-base mb-2" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.01em' }}>
                ¿Aceptar este presupuesto?
              </p>
              <p className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>
                <strong style={{ color: 'var(--color-nieve)' }}>{q.providerName}</strong> — {formatARS(q.amount)}
              </p>
              <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
                Los otros presupuestos quedarán descartados y se te mostrará el contacto del prestador.
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
                  className="flex-1 py-2.5 rounded-full text-sm font-bold text-white active:scale-95 transition-all"
                  style={{ backgroundColor: 'var(--color-bosque-lt)' }}
                >
                  Sí, aceptar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}

// ─── QuoteCard ─────────────────────────────────────────────────────────────────

type QuoteCardProps = { quote: Quote; isOpen: boolean; onAccept: () => void }

function QuoteCard({ quote, isOpen, onAccept }: QuoteCardProps) {
  const isAccepted = quote.status === 'accepted'
  const isRejected = quote.status === 'rejected'

  return (
    <div
      className={cn('rounded-xl border overflow-hidden')}
      style={{
        backgroundColor: 'var(--color-sombra)',
        borderColor: isAccepted ? 'var(--color-bosque-lt)' : 'var(--color-line)',
        opacity: isRejected ? 0.5 : 1,
      }}
    >
      <div className="p-4">
        {/* Provider row */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
            style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-lt)' }}
          >
            {quote.providerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm truncate" style={{ color: 'var(--color-nieve)' }}>
                {quote.providerName}
              </p>
              {quote.providerVerified && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--color-brand-tint)', color: 'var(--color-bosque-lt)' }}
                >
                  ✓ VER
                </span>
              )}
            </div>
            {quote.providerRating && (
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                <span style={{ color: '#E8A020' }}>★</span>{' '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>{quote.providerRating.toFixed(1)}</span>
                {quote.estimatedDays && ` · ${quote.estimatedDays}d de trabajo`}
              </p>
            )}
          </div>
          <p
            className="font-black text-base shrink-0"
            style={{ color: 'var(--color-nieve)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
          >
            {formatARS(quote.amount)}
          </p>
        </div>

        {/* Mensaje */}
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          {quote.message}
        </p>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-t"
        style={{ borderColor: 'var(--color-line)', backgroundColor: 'rgba(0,0,0,0.02)' }}
      >
        <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
          {timeAgo(quote.createdAt)}
        </span>

        {isAccepted ? (
          <a
            href={`https://wa.me/${(quote.providerPhone ?? '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white active:scale-95 transition-all"
            style={{ backgroundColor: '#25D366' }}
          >
            <IconWhatsApp /> Contactar
          </a>
        ) : isRejected ? (
          <span className="text-xs font-bold" style={{ color: 'var(--color-muted)' }}>
            No seleccionado
          </span>
        ) : isOpen ? (
          <button
            onClick={onAccept}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-white active:scale-95 transition-all"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
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
    <span
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border"
      style={{
        backgroundColor: 'var(--color-sombra)',
        borderColor: 'var(--color-line)',
        color: 'var(--color-muted)',
        fontFamily: mono ? 'var(--font-mono)' : undefined,
      }}
    >
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
