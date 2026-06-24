import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ciudades, rubros } from '@/design-system/tokens'

// ─── Tipos del RPC ──────────────────────────────────────────────────────────────
type Claimable = {
  id: string
  name: string
  rubro_id: string
  ciudad_id: string
  whatsapp_number: string | null
  external_rating: number | null
  external_reviews: number | null
  status: string
  already_claimed: boolean
}
type ClaimResult = { ok: boolean; id?: string; name?: string; error?: string }

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 px-8 text-center" style={{ backgroundColor: 'var(--color-noche)' }}>
      {children}
    </div>
  )
}

// ─── ClaimProfilePage — /activar/:id ──────────────────────────────────────────────
export function ClaimProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { hash } = useLocation()
  const navigate = useNavigate()
  // token en el fragment (#t=...): no viaja al server (Referer/logs) ni a PostHog
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('t')

  const [profile, setProfile]   = useState<Claimable | null | undefined>(undefined) // undefined = cargando
  const [whatsapp, setWhatsapp] = useState('')
  const [editPhone, setEditPhone] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed]   = useState<{ id: string; name: string } | null>(null)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!token) { setProfile(null); return }
      const { data } = await supabase.rpc('get_claimable_by_token', { p_token: token })
      if (cancelled) return
      const p = (data as unknown as Claimable | null)
      setProfile(p)
      if (p?.whatsapp_number) setWhatsapp(p.whatsapp_number)
    })()
    return () => { cancelled = true }
  }, [token])

  async function handleClaim() {
    if (!token) return
    setClaiming(true); setError(null)
    const { data, error: e } = await supabase.rpc('claim_provider', { p_token: token, p_whatsapp: whatsapp })
    setClaiming(false)
    const res = (data as unknown as ClaimResult | null)
    if (e || !res?.ok) { setError('No se pudo activar. El link puede estar vencido o ya usado.'); return }
    setClaimed({ id: res.id ?? id ?? '', name: res.name ?? '' })
  }

  if (profile === undefined) return <Center><p className="text-[--color-muted]">Cargando…</p></Center>

  if (!profile) return (
    <Center>
      <span className="text-5xl mb-3">🔗</span>
      <p className="text-[--color-nieve] font-bold text-lg">Link inválido o vencido</p>
      <p className="text-[--color-muted] text-sm">Revisá el enlace que te enviamos por WhatsApp.</p>
    </Center>
  )

  // Éxito (recién reclamado) o ya estaba activo
  if (claimed || profile.already_claimed) {
    const pid = claimed?.id || profile.id
    return (
      <Center>
        <span className="text-6xl mb-4">🎉</span>
        <h1 className="font-black text-2xl text-[--color-nieve] mb-2" style={{ letterSpacing: '-0.02em' }}>
          {claimed ? '¡Tu perfil está activo!' : 'Este perfil ya está activo'}
        </h1>
        <p className="text-sm text-[--color-muted] mb-7 max-w-xs">
          {claimed
            ? 'Ya podés recibir contactos de clientes. Sumá tu verificación y elegí un plan para destacar.'
            : 'Ya fue confirmado. Entrá a tu perfil para gestionarlo.'}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(`/prestador/${pid}`)}
            className="w-full py-3.5 rounded-full font-bold text-sm text-white active:scale-95 transition-all"
            style={{ backgroundColor: 'var(--color-bosque-lt)' }}
          >
            Ver mi perfil
          </button>
          {claimed && (
            <>
              <button
                onClick={() => navigate('/verificacion')}
                className="w-full py-3 rounded-full font-bold text-sm border active:scale-95 transition-all"
                style={{ borderColor: 'var(--color-line)', color: 'var(--color-nieve)' }}
              >
                Verificá tu identidad (DNI/matrícula)
              </button>
              <button
                onClick={() => navigate('/planes')}
                className="w-full py-3 rounded-full font-bold text-sm border active:scale-95 transition-all"
                style={{ borderColor: 'var(--color-line)', color: 'var(--color-muted)' }}
              >
                Ver planes para destacar
              </button>
            </>
          )}
        </div>
      </Center>
    )
  }

  const rubroData  = rubros.find(r => r.id === profile.rubro_id)
  const ciudadData = ciudades.find(c => c.id === profile.ciudad_id)

  return (
    <div className="min-h-screen text-[--color-nieve]" style={{ backgroundColor: 'var(--color-noche)' }}>
      <header
        className="fixed top-0 w-full z-50 flex items-center px-6 h-16 border-b border-[--color-line]"
        style={{ backgroundColor: 'var(--color-noche)' }}
      >
        <h1 className="font-black text-base" style={{ letterSpacing: '-0.02em' }}>Activá tu perfil</h1>
      </header>

      <main className="pt-16 pb-10 max-w-xl mx-auto px-6">
        <div className="pt-8 text-center">
          <span className="text-5xl mb-4 inline-block">👋</span>
          <h2 className="text-2xl font-black mb-2" style={{ letterSpacing: '-0.02em' }}>
            Te armamos tu perfil en Oficio
          </h2>
          <p className="text-sm text-[--color-muted] mb-7 max-w-sm mx-auto">
            Confirmá que sos vos y empezá a recibir contactos de clientes de la zona — <strong className="text-[--color-nieve]">gratis</strong>.
          </p>
        </div>

        {/* Tarjeta del perfil pre-armado */}
        <div className="rounded-[--radius-xl] p-5 mb-7 border" style={{ backgroundColor: 'var(--color-sombra)', borderColor: 'var(--color-line)' }}>
          <p className="text-lg font-bold text-[--color-nieve]">{profile.name}</p>
          <p className="text-sm text-[--color-bosque-lt] font-semibold mt-0.5">
            {rubroData?.icon} {rubroData?.label} · <span className="text-[--color-muted] font-normal">{ciudadData?.label}</span>
          </p>
          {profile.external_rating != null && (
            <p className="text-xs text-[--color-muted] mt-2">
              ★ {Number(profile.external_rating).toFixed(1)} en Google
              {profile.external_reviews ? ` (${profile.external_reviews} reseñas)` : ''}
            </p>
          )}
        </div>

        {/* WhatsApp confirmado / editable */}
        <div className="mb-7">
          {!editPhone ? (
            <p className="text-sm text-[--color-muted] text-center">
              Te contactamos al <span className="font-mono text-[--color-nieve]">{whatsapp || '—'}</span>.{' '}
              <button onClick={() => setEditPhone(true)} className="text-[--color-bosque-lt] font-semibold underline">¿Otro número?</button>
            </p>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-[--color-muted]">Tu WhatsApp</label>
              <input
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+549..."
                className="w-full h-14 px-4 rounded-xl text-[--color-nieve] focus:outline-none focus:ring-1"
                style={{ backgroundColor: '#090f14' }}
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-center mb-4" style={{ color: '#ffb4ab' }}>{error}</p>}

        {/* CTA: un toque */}
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full py-4 rounded-full font-bold text-white text-base active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-bosque-lt)' }}
        >
          {claiming ? 'Activando…' : 'Sí, soy yo — activar mi perfil'}
        </button>
        <p className="text-center text-xs text-[--color-muted] mt-4">
          Al activar, confirmás que sos el titular y aceptás recibir contactos por WhatsApp.
        </p>
      </main>
    </div>
  )
}
