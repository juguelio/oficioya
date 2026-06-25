import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ciudades, rubros } from '@/design-system/tokens'
import { track } from '@/lib/analytics'

type Revealed = { name: string; whatsapp: string; rubro: string; ciudad: string }
type State = 'verifying' | 'approved' | 'pending' | 'failed'

// Vuelta desde MercadoPago: verifica el pago vía edge function y, si está aprobado,
// revela el WhatsApp del prestador con el mensaje de urgencia precargado (§8).
export function EmergencyContactPage() {
  const { id }       = useParams<{ id: string }>()
  const [params]     = useSearchParams()
  const navigate     = useNavigate()

  const reference = params.get('ref') ?? params.get('external_reference')
  const paymentId = params.get('payment_id') ?? params.get('collection_id')

  const [state, setState]       = useState<State>('verifying')
  const [data, setData]         = useState<Revealed | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!reference) { setState('failed'); return }
      const { data: res, error } = await supabase.functions.invoke('emergency-verify', {
        body: { reference, paymentId },
      })
      if (cancelled) return
      if (error || !res) { setState('failed'); return }
      const r = res as { status: string } & Partial<Revealed>
      if (r.status === 'approved' && r.whatsapp) {
        setData({ name: r.name ?? '', whatsapp: r.whatsapp, rubro: r.rubro ?? '', ciudad: r.ciudad ?? '' })
        setState('approved')
      } else if (r.status === 'pending' || r.status === 'in_process') {
        setState('pending')
      } else {
        setState('failed')
      }
    })()
    return () => { cancelled = true }
  }, [reference, paymentId])

  const rubroLabel  = data ? (rubros.find(r => r.id === data.rubro)?.label ?? 'el oficio') : ''
  const ciudadLabel = data ? (ciudades.find(c => c.id === data.ciudad)?.label ?? '') : ''

  function waLink(d: Revealed): string {
    const msg = `Hola ${d.name.split(' ')[0]}, te contacto desde Oficio. Tengo una urgencia con ${rubroLabel} en ${ciudadLabel}. ¿Podés venir?`
    return `https://wa.me/${d.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-noche)' }}>
      <header className="flex items-center gap-3 px-5 h-14 border-b" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
        <button onClick={() => navigate('/emergencias')} className="p-2 rounded-xl active:scale-95" style={{ color: 'var(--color-bosque-lt)' }} aria-label="Volver">
          <IconArrowLeft />
        </button>
        <h1 className="font-bold text-base" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>Tu contacto</h1>
      </header>

      <main className="flex-1 px-5 pt-8 pb-10 max-w-xl mx-auto w-full">
        {state === 'verifying' && <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>Confirmando tu pago…</p>}

        {state === 'pending' && (
          <Box icon="⏳" title="Tu pago está en proceso"
            body="Apenas MercadoPago lo confirme vas a poder ver el contacto. Suele tardar unos minutos." />
        )}

        {state === 'failed' && (
          <Box icon="⚠️" title="No pudimos confirmar el pago"
            body="Si te debitaron, escribinos y lo resolvemos. Si no, podés intentar de nuevo desde urgencias."
            cta={{ label: 'Volver a urgencias', onClick: () => navigate('/emergencias') }} />
        )}

        {state === 'approved' && data && (
          <>
            <div className="rounded-[--radius-xl] p-5 border mb-5 text-center" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-guardia)' }}>
              <span className="text-3xl">✅</span>
              <p className="font-black text-lg mt-2" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>¡Listo! Contactá a {data.name.split(' ')[0]}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Le escribimos tu urgencia. Si no responde en 10 minutos, te damos un crédito.
              </p>
            </div>

            <a
              href={waLink(data)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_click', { providerId: id, ciudad: data.ciudad, rubro: data.rubro, source: 'emergency' })}
              className="flex w-full items-center justify-center gap-2 rounded-[--radius-full] py-4 font-bold text-white text-base active:scale-[0.98] transition-transform shadow-lg"
              style={{ background: '#25D366' }}
            >
              <IconWhatsApp />
              Contactar por WhatsApp
            </a>
            <p className="text-center text-xs mt-3" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
              {data.whatsapp.replace(/(\+54)(9)(\d{4})(\d{3})(\d{4})/, '$1 $2 $3 $4-$5')}
            </p>
          </>
        )}
      </main>
    </div>
  )
}

function Box({ icon, title, body, cta }: { icon: string; title: string; body: string; cta?: { label: string; onClick: () => void } }) {
  return (
    <div className="rounded-[--radius-xl] p-6 border text-center" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
      <span className="text-3xl">{icon}</span>
      <p className="font-bold text-base mt-2" style={{ color: 'var(--color-nieve)' }}>{title}</p>
      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{body}</p>
      {cta && (
        <button onClick={cta.onClick} className="mt-4 px-5 py-2.5 rounded-[--radius-lg] text-sm font-semibold border active:scale-95" style={{ borderColor: 'var(--color-line)', color: 'var(--color-nieve)' }}>
          {cta.label}
        </button>
      )}
    </div>
  )
}

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function IconWhatsApp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L.057 23.882l6.2-1.625A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.368l-.36-.214-3.68.965.981-3.595-.234-.369A9.818 9.818 0 1112 21.818z" />
    </svg>
  )
}
