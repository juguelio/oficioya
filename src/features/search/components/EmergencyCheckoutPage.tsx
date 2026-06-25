import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toProvider } from '@/features/providers/hooks/useProviders'
import { ciudades, rubros } from '@/design-system/tokens'
import { formatARS } from '@/shared/utils/formatARS'
import type { Provider } from '@/features/providers/types'
import type { DbProviderPublic } from '@/lib/database.types'

// Paywall de urgencia (§8): el cliente paga ANTES de que se revele el WhatsApp del prestador
// en guardia. Inicia el checkout de MercadoPago vía edge function.
export function EmergencyCheckoutPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [provider, setProvider] = useState<Provider | null | undefined>(undefined)
  const [paying, setPaying]     = useState(false)
  const [err, setErr]           = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) { setProvider(null); return }
      const { data } = await supabase.from('providers_public').select('*').eq('id', id).maybeSingle()
      if (cancelled) return
      setProvider(data ? toProvider(data as DbProviderPublic) : null)
    })()
    return () => { cancelled = true }
  }, [id])

  async function handlePay() {
    if (!id || paying) return
    setPaying(true)
    setErr(null)
    const { data, error } = await supabase.functions.invoke('emergency-checkout', { body: { providerId: id } })
    if (error || !data?.init_point) {
      setPaying(false)
      setErr(
        (data && (data as { error?: string }).error) === 'mp_not_configured'
          ? 'El pago todavía no está disponible. Estamos terminando de configurarlo.'
          : 'No pudimos iniciar el pago. Probá de nuevo en un momento.',
      )
      return
    }
    window.location.href = data.init_point as string
  }

  if (provider === undefined) return <Center text="Cargando…" />
  if (!provider)              return <Center text="No encontramos este prestador." onBack={() => navigate(-1)} />

  if (!provider.isEmergencyAvailable) {
    return <Center text="Este prestador ya no está en guardia. Volvé a la lista de urgencias." onBack={() => navigate('/emergencias')} />
  }

  const rubro  = rubros.find(r => r.id === provider.rubro)
  const ciudad = ciudades.find(c => c.id === provider.ciudad)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-noche)' }}>
      <header className="flex items-center gap-3 px-5 h-14 border-b" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl active:scale-95" style={{ color: 'var(--color-bosque-lt)' }} aria-label="Volver">
          <IconArrowLeft />
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-emergency)' }} />
          <h1 className="font-bold text-base" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>Contacto de urgencia</h1>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-10 max-w-xl mx-auto w-full">
        <div className="rounded-[--radius-xl] p-5 border mb-5" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-guardia)' }} />
            <h2 className="font-bold text-lg" style={{ color: 'var(--color-nieve)', letterSpacing: '-0.02em' }}>{provider.name}</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {rubro?.icon} {rubro?.label} · {ciudad?.label} · en guardia ahora
          </p>
        </div>

        <div className="rounded-[--radius-xl] p-5 border mb-5" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-nieve)' }}>Contacto de urgencia</span>
            <span className="text-2xl font-black" style={{ color: 'var(--color-nieve)', fontFamily: 'var(--font-mono)' }}>{formatARS(20000)}</span>
          </div>
          <ul className="space-y-2">
            {[
              'Te mostramos el WhatsApp directo del prestador apenas pagás.',
              'Mensaje listo para enviar, con tu urgencia precargada.',
              'Garantía: si no te responde en 10 minutos, te damos un crédito para la próxima.',
            ].map(t => (
              <li key={t} className="flex gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                <span style={{ color: 'var(--color-guardia)' }}>✓</span> {t}
              </li>
            ))}
          </ul>
        </div>

        {err && (
          <p className="text-sm font-semibold mb-4 text-center" style={{ color: '#ffb4ab' }}>{err}</p>
        )}

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full py-4 rounded-[--radius-full] font-bold text-white text-base active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-emergency)' }}
        >
          {paying ? 'Abriendo el pago…' : `Pagar ${formatARS(20000)} y ver contacto`}
        </button>
        <p className="text-center text-[11px] mt-3" style={{ color: 'var(--color-muted)' }}>
          Pago seguro con MercadoPago. No compartimos tu número con el prestador hasta que lo contactes vos.
        </p>
      </main>
    </div>
  )
}

function Center({ text, onBack }: { text: string; onBack?: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-8 text-center" style={{ backgroundColor: 'var(--color-noche)' }}>
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{text}</p>
      {onBack && (
        <button onClick={onBack} className="px-5 py-2.5 rounded-[--radius-lg] text-sm font-semibold border active:scale-95" style={{ borderColor: 'var(--color-line)', color: 'var(--color-nieve)' }}>
          ← Volver
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
