import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/utils/cn'
import { ciudades, rubros } from '@/design-system/tokens'
import { formatARS } from '@/shared/utils/formatARS'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { sendWelcomeEmail, sendNewProviderAlert } from '@/lib/notifications'

// ─── Tipos ──────────────────────────────────────────────────────────────────────

type Phase =
  | 'name' | 'whatsapp' | 'ciudad' | 'rubro' | 'barrio'
  | 'bio' | 'email' | 'password' | 'photo' | 'plan'
  | 'confirm' | 'creating' | 'done'

type Message = {
  id:   number
  role: 'agent' | 'user'
  text: string
}

type Draft = {
  name:                 string
  whatsapp_number:      string
  ciudad_id:            string
  rubro_id:             string
  barrio:               string
  bio:                  string
  email:                string
  password:             string
  subscription_tier_id: 'basico' | 'profesional' | 'destacado' | ''
}

type PlanMeta = {
  id:       'basico' | 'profesional' | 'destacado'
  label:    string
  priceARS: number
  contacts: string
  accent:   string
}

const PLANS: PlanMeta[] = [
  { id: 'basico',      label: 'Básico',      priceARS: 20000, contacts: '8 contactos/mes',      accent: '#4A8C49' },
  { id: 'profesional', label: 'Profesional', priceARS: 35000, contacts: 'Contactos ilimitados', accent: '#2E6E8A' },
  { id: 'destacado',   label: 'Destacado',   priceARS: 55000, contacts: 'Ilimitados + banner',  accent: '#F5C842' },
]

const EMPTY_DRAFT: Draft = {
  name: '', whatsapp_number: '+549', ciudad_id: '', rubro_id: '',
  barrio: '', bio: '', email: '', password: '', subscription_tier_id: '',
}

// ─── Prompts del agente por fase ─────────────────────────────────────────────────

function agentPrompt(phase: Phase, draft: Draft): string[] {
  switch (phase) {
    case 'whatsapp':
      return [`¡Bienvenido, ${draft.name.split(' ')[0]}! 👋`, '¿Cuál es tu WhatsApp? Ahí te van a llegar los contactos de los clientes.']
    case 'ciudad':   return ['¿En qué ciudad trabajás?']
    case 'rubro':    return ['Buenísimo. ¿Cuál es tu oficio?']
    case 'barrio':   return ['¿En qué barrio o zona estás? Así los clientes cercanos te encuentran primero.']
    case 'bio':      return ['Contame en una línea qué hacés. Una buena descripción te consigue más trabajos.']
    case 'email':    return ['Vamos a crear tu cuenta. ¿Cuál es tu email?']
    case 'password': return ['Elegí una contraseña (mínimo 8 caracteres).']
    case 'photo':    return ['¿Querés subir una foto de perfil? Genera más confianza. Podés saltarlo y agregarla después.']
    case 'plan':     return ['Último paso: elegí tu plan. El pago lo confirmás después de crear el perfil.']
    case 'confirm':  return [`Listo, ${draft.name.split(' ')[0]}. Revisá que esté todo bien y creamos tu perfil. 🚀`]
    default:         return []
  }
}

// ─── Validación por fase ─────────────────────────────────────────────────────────

function validate(phase: Phase, value: string): string | null {
  switch (phase) {
    case 'name':     return value.trim().length >= 2 ? null : 'Necesito tu nombre completo (al menos 2 letras).'
    case 'whatsapp': return value.startsWith('+54') && value.replace(/\D/g, '').length >= 11
      ? null : 'Poné el número con código, ej: +5492944123456.'
    case 'barrio':   return value.trim().length >= 2 ? null : 'Decime tu barrio o zona.'
    case 'email':    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Ese email no parece válido.'
    case 'password': return value.length >= 8 ? null : 'La contraseña necesita al menos 8 caracteres.'
    default:         return null
  }
}

// ─── Orden de fases ──────────────────────────────────────────────────────────────

const NEXT: Record<string, Phase> = {
  name: 'whatsapp', whatsapp: 'ciudad', ciudad: 'rubro', rubro: 'barrio',
  barrio: 'bio', bio: 'email', email: 'password', password: 'photo',
  photo: 'plan', plan: 'confirm',
}

// Mapea cada fase de texto a su campo real en Draft. 'whatsapp' → 'whatsapp_number'
// (el nombre de fase no coincide con la clave) — sin esto, el número se perdía.
const TEXT_FIELD: Partial<Record<Phase, keyof Draft>> = {
  name: 'name',
  whatsapp: 'whatsapp_number',
  barrio: 'barrio',
  bio: 'bio',
  email: 'email',
  password: 'password',
}

// ─── Componente ──────────────────────────────────────────────────────────────────

export function ConversationalOnboarding() {
  const navigate   = useNavigate()
  const { signUp } = useAuth()

  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'agent', text: 'Hola, soy el asistente de Oficio. Te doy de alta como prestador en un par de minutos.' },
    { id: 1, role: 'agent', text: 'Para arrancar, ¿cómo te llamás?' },
  ])
  const [phase,        setPhase]        = useState<Phase>('name')
  const [typing,       setTyping]       = useState(false)
  const [draft,        setDraft]        = useState<Draft>(EMPTY_DRAFT)
  const [textValue,    setTextValue]    = useState('')
  const [photoFile,    setPhotoFile]    = useState<File | null>(null)
  const [submitError,  setSubmitError]  = useState<string | null>(null)
  const [referralOpen, setReferralOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef    = useRef<HTMLDivElement>(null)
  const msgId        = useRef(2)
  const typingTimer  = useRef<number | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  // Limpia el timer de "escribiendo" si el componente se desmonta a mitad del delay.
  useEffect(() => () => { if (typingTimer.current) window.clearTimeout(typingTimer.current) }, [])

  function pushAgent(lines: string[]) {
    setTyping(true)
    typingTimer.current = window.setTimeout(() => {
      setMessages(prev => [...prev, ...lines.map(text => ({ id: msgId.current++, role: 'agent' as const, text }))])
      setTyping(false)
    }, 650)
  }

  function pushUser(text: string) {
    setMessages(prev => [...prev, { id: msgId.current++, role: 'user', text }])
  }

  // Avanza a la próxima fase guardando el valor, con burbuja de usuario y prompt del agente.
  function advance(field: keyof Draft, value: string, displayText: string) {
    pushUser(displayText)
    const nextDraft = { ...draft, [field]: value }
    setDraft(nextDraft)
    const next = NEXT[phase]
    setPhase(next)
    pushAgent(agentPrompt(next, nextDraft))
  }

  function submitText() {
    const value = textValue.trim()
    const err = validate(phase, value)
    if (err) { pushUser(phase === 'password' ? '•'.repeat(value.length || 1) : value || '—'); pushAgent([err]); return }

    const field = TEXT_FIELD[phase]
    if (!field) return
    const display = phase === 'password' ? '•'.repeat(value.length) : (value || '—')
    setTextValue('')
    advance(field, value, display)
  }

  function skipOptional() {
    if (phase === 'bio') {
      setTextValue('')
      advance('bio', '', 'Prefiero saltarlo')
    } else if (phase === 'photo') {
      pushUser('Subo la foto después')
      setPhase('plan')
      pushAgent(agentPrompt('plan', draft))
    }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    pushUser('📷 Foto subida')
    setPhase('plan')
    pushAgent(agentPrompt('plan', draft))
  }

  async function createProfile() {
    setSubmitError(null)
    setPhase('creating')
    pushUser('Confirmar y crear perfil')

    const { data: authData, error: authError } = await signUp(draft.email, draft.password, {
      name:                 draft.name,
      phone:                draft.whatsapp_number,
      whatsapp_number:      draft.whatsapp_number,
      barrio:               draft.barrio,
      bio:                  draft.bio,
      ciudad_id:            draft.ciudad_id,
      rubro_id:             draft.rubro_id,
      subscription_tier_id: draft.subscription_tier_id || 'basico',
    })

    if (authError) {
      setSubmitError(
        authError.message === 'User already registered'
          ? 'Ya existe una cuenta con ese email. Probá iniciando sesión.'
          : authError.message,
      )
      setPhase('confirm')
      pushAgent(['Ups, algo falló al crear la cuenta. Fijate el detalle abajo y reintentá.'])
      return
    }

    if (photoFile && authData.session) {
      const ext  = photoFile.name.split('.').pop() ?? 'jpg'
      const path = `${authData.user!.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('provider-photos')
        .upload(path, photoFile, { contentType: photoFile.type, upsert: false })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('provider-photos').getPublicUrl(path)
        await supabase.from('providers').update({ photos: [urlData.publicUrl] }).eq('auth_user_id', authData.user!.id)
      }
    }

    sendWelcomeEmail({ email: draft.email, name: draft.name, plan: draft.subscription_tier_id || 'basico', ciudad: draft.ciudad_id })
    sendNewProviderAlert({ name: draft.name, email: draft.email, rubro: draft.rubro_id, ciudad: draft.ciudad_id, plan: draft.subscription_tier_id || 'basico' })

    setPhase('done')
    setReferralOpen(true) // último paso: pedir referidos (warm leads) antes de verificación
  }

  const ciudadLabel = ciudades.find(c => c.id === draft.ciudad_id)?.label ?? ''
  const rubroLabel  = rubros.find(r => r.id === draft.rubro_id)?.label ?? ''

  if (referralOpen) {
    return <ReferralStep referrer={draft.name} ciudad={draft.ciudad_id} onDone={() => navigate('/verificacion')} />
  }

  return (
    <div className="flex flex-col h-[100dvh] text-[--color-nieve]" style={{ backgroundColor: 'var(--color-noche)' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-3 px-5 h-16 border-b border-[--color-line] backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(14,20,25,0.85)' }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-[--color-bosque-lt] hover:bg-white/5 transition-all active:scale-95"
          aria-label="Volver"
        >
          <IconArrowLeft />
        </button>
        <AgentAvatar />
        <div className="leading-tight">
          <p className="text-sm font-bold text-[--color-nieve]">Asistente de Oficio</p>
          <p className="text-xs text-[--color-bosque-lt]">en línea</p>
        </div>
      </header>

      {/* ── Conversación ────────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-xl mx-auto flex flex-col gap-2.5">
          {messages.map(m => <Bubble key={m.id} role={m.role} text={m.text} />)}
          {typing && <TypingBubble />}
        </div>
      </div>

      {/* ── Zona de entrada ─────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[--color-line] px-4 py-3" style={{ backgroundColor: 'var(--color-noche)' }}>
        <div className="max-w-xl mx-auto">
          {renderInput()}
        </div>
      </div>
    </div>
  )

  // ── Render de la entrada según la fase ──────────────────────────────────────
  function renderInput() {
    if (typing) return <InputHint text="…" />

    if (phase === 'ciudad') {
      return (
        <div className="flex flex-col gap-2">
          {ciudades.map(c => (
            <QuickReply key={c.id} onClick={() => advance('ciudad_id', c.id, c.label)}>{c.label}</QuickReply>
          ))}
        </div>
      )
    }

    if (phase === 'rubro') {
      return (
        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
          {rubros.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => advance('rubro_id', r.id, r.label)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-[--radius-lg] border border-[--color-line] bg-[--color-sombra] text-left transition-all active:scale-[0.98] hover:border-[--color-bosque-lt]/40"
            >
              <span className="text-lg leading-none">{r.icon}</span>
              <span className="text-sm font-semibold text-[--color-muted]">{r.label}</span>
            </button>
          ))}
        </div>
      )
    }

    if (phase === 'photo') {
      return (
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 h-12 rounded-[--radius-full] font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ backgroundColor: 'var(--color-bosque-lt)', color: 'var(--color-noche)' }}
          >
            <IconCamera /> Subir foto
          </button>
          <button type="button" onClick={skipOptional} className="px-4 h-12 text-sm font-semibold text-[--color-muted] hover:text-[--color-nieve] transition-colors">
            Saltar
          </button>
        </div>
      )
    }

    if (phase === 'plan') {
      return (
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {PLANS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => advance('subscription_tier_id', p.id, `Plan ${p.label}`)}
              className="flex items-center justify-between px-4 py-3 rounded-[--radius-lg] border border-[--color-line] bg-[--color-sombra] text-left transition-all active:scale-[0.98] hover:border-[--color-bosque-lt]/40"
            >
              <span className="flex flex-col">
                <span className="text-sm font-bold" style={{ color: p.accent }}>{p.label}</span>
                <span className="text-xs text-[--color-muted]">{p.contacts}</span>
              </span>
              <span className="text-sm font-bold text-[--color-nieve]" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatARS(p.priceARS)}<span className="text-xs text-[--color-muted]">/mes</span>
              </span>
            </button>
          ))}
        </div>
      )
    }

    if (phase === 'confirm') {
      return (
        <div className="flex flex-col gap-3">
          <Summary draft={draft} ciudad={ciudadLabel} rubro={rubroLabel} hasPhoto={!!photoFile} />
          {submitError && (
            <p className="text-xs font-semibold px-1" style={{ color: '#ffb4ab' }}>{submitError}</p>
          )}
          <button
            type="button"
            onClick={createProfile}
            className="w-full py-3.5 rounded-[--radius-full] font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ backgroundColor: 'var(--color-bosque-lt)', color: 'var(--color-noche)' }}
          >
            Confirmar y crear perfil <IconArrowRight />
          </button>
        </div>
      )
    }

    if (phase === 'creating') return <InputHint text="Creando tu perfil…" />
    if (phase === 'done')     return <InputHint text="¡Listo!" />

    // Fases de texto: name, whatsapp, barrio, bio, email, password
    const isPassword = phase === 'password'
    const isOptional = phase === 'bio'
    return (
      <div className="flex items-center gap-2">
        <input
          key={phase}
          value={textValue}
          onChange={e => setTextValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitText() } }}
          type={isPassword ? 'password' : phase === 'email' ? 'email' : phase === 'whatsapp' ? 'tel' : 'text'}
          inputMode={phase === 'whatsapp' ? 'tel' : undefined}
          autoComplete={isPassword ? 'new-password' : phase === 'email' ? 'email' : 'off'}
          placeholder={placeholderFor(phase)}
          autoFocus
          className="flex-1 h-12 px-4 rounded-[--radius-full] text-[--color-nieve] bg-[--color-sombra] border border-[--color-line] placeholder:text-[--color-muted]/60 focus:outline-none focus:ring-1 focus:ring-[--color-bosque-lt]/40"
        />
        {isOptional && (
          <button type="button" onClick={skipOptional} className="px-3 h-12 text-sm font-semibold text-[--color-muted] hover:text-[--color-nieve] transition-colors">
            Saltar
          </button>
        )}
        <button
          type="button"
          onClick={submitText}
          aria-label="Enviar"
          className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ backgroundColor: 'var(--color-bosque-lt)', color: 'var(--color-noche)' }}
        >
          <IconSend />
        </button>
      </div>
    )
  }
}

// ─── ReferralStep — loop de referidos (warm leads) ───────────────────────────

type ReferralRow = { name: string; phone: string }

function ReferralStep({ referrer, ciudad, onDone }: { referrer: string; ciudad: string; onDone: () => void }) {
  const [rows, setRows]       = useState<ReferralRow[]>([{ name: '', phone: '+549' }, { name: '', phone: '+549' }])
  const [sending, setSending] = useState(false)

  function update(i: number, field: keyof ReferralRow, value: string) {
    setRows(rs => rs.map((r, j) => (j === i ? { ...r, [field]: value } : r)))
  }

  async function send() {
    const referrals = rows
      .filter(r => r.phone.replace(/\D/g, '').length >= 11)
      .map(r => ({ name: r.name.trim(), phone: r.phone.trim() }))
    if (referrals.length === 0) { onDone(); return }
    setSending(true)
    await supabase.rpc('submit_referral', { p_referrer: referrer, p_ciudad: ciudad, p_referrals: referrals })
    setSending(false)
    onDone()
  }

  return (
    <div className="flex flex-col min-h-[100dvh] px-6 pt-16 pb-10 text-[--color-nieve]" style={{ backgroundColor: 'var(--color-noche)' }}>
      <div className="max-w-xl mx-auto w-full">
        <span className="text-5xl">🙌</span>
        <h1 className="text-2xl font-bold mt-4 mb-2" style={{ letterSpacing: '-0.02em' }}>¡Listo, ya estás dentro!</h1>
        <p className="text-sm text-[--color-muted] mb-6">
          Una última y nos ayudás un montón: ¿conocés 1 o 2 colegas de confianza que también podrían sumarse?
          Les llega la invitación de tu parte.
        </p>

        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={r.name}
                onChange={e => update(i, 'name', e.target.value)}
                placeholder="Nombre del colega"
                className="flex-1 h-12 px-4 rounded-[--radius-full] text-[--color-nieve] bg-[--color-sombra] border border-[--color-line] placeholder:text-[--color-muted]/60 focus:outline-none focus:ring-1 focus:ring-[--color-bosque-lt]/40"
              />
              <input
                value={r.phone}
                onChange={e => update(i, 'phone', e.target.value)}
                type="tel"
                inputMode="tel"
                placeholder="+5492972..."
                className="w-40 h-12 px-3 rounded-[--radius-full] text-[--color-nieve] bg-[--color-sombra] border border-[--color-line] placeholder:text-[--color-muted]/60 focus:outline-none focus:ring-1 focus:ring-[--color-bosque-lt]/40"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-8">
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="w-full py-3.5 rounded-[--radius-full] font-bold text-base transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-bosque-lt)', color: 'var(--color-noche)' }}
          >
            {sending ? 'Enviando…' : 'Recomendar y terminar'}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="w-full py-2 text-sm font-semibold text-[--color-muted] hover:text-[--color-nieve] transition-colors"
          >
            Saltar
          </button>
        </div>
      </div>
    </div>
  )
}

function placeholderFor(phase: Phase): string {
  switch (phase) {
    case 'name':     return 'Tu nombre y apellido'
    case 'whatsapp': return '+5492944123456'
    case 'barrio':   return 'Ej: Melipal, Centro, El Cruce'
    case 'bio':      return 'Ej: Electricista matriculado, urgencias 24hs'
    case 'email':    return 'tu@email.com'
    case 'password': return 'Mínimo 8 caracteres'
    default:         return 'Escribí acá…'
  }
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────────

type BubbleProps = { role: 'agent' | 'user'; text: string }

function Bubble({ role, text }: BubbleProps) {
  const isAgent = role === 'agent'
  return (
    <div className={cn('flex items-end gap-2', isAgent ? 'justify-start' : 'justify-end')}>
      {isAgent && <AgentAvatar small />}
      <div
        className={cn(
          'max-w-[80%] px-4 py-2.5 text-sm leading-relaxed',
          isAgent
            ? 'rounded-[--radius-xl] rounded-bl-sm bg-[--color-sombra] text-[--color-nieve]'
            : 'rounded-[--radius-xl] rounded-br-sm text-[--color-noche] font-medium',
        )}
        style={isAgent ? undefined : { backgroundColor: 'var(--color-bosque-lt)' }}
      >
        {text}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <AgentAvatar small />
      <div className="rounded-[--radius-xl] rounded-bl-sm bg-[--color-sombra] px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[--color-muted] animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function AgentAvatar({ small }: { small?: boolean }) {
  const size = small ? 'w-7 h-7' : 'w-9 h-9'
  return (
    <div
      className={cn(size, 'shrink-0 rounded-full flex items-center justify-center')}
      style={{ backgroundColor: 'var(--color-bosque-dk)' }}
    >
      <svg width={small ? 14 : 18} height={small ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="var(--color-bosque-lt)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.8L20 10l-5.1 3.5L16 20l-4-3.5L8 20l1.1-6.5L4 10l6.1-1.2z" />
      </svg>
    </div>
  )
}

function InputHint({ text }: { text: string }) {
  return <p className="text-center text-sm text-[--color-muted] py-3">{text}</p>
}

type QuickReplyProps = { onClick: () => void; children: React.ReactNode }

function QuickReply({ onClick, children }: QuickReplyProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-5 py-3 rounded-[--radius-full] border border-[--color-bosque-lt]/40 bg-[--color-sombra] text-sm font-semibold text-[--color-nieve] text-left transition-all active:scale-[0.98] hover:bg-[--color-bosque-lt]/10"
    >
      {children}
    </button>
  )
}

type SummaryProps = { draft: Draft; ciudad: string; rubro: string; hasPhoto: boolean }

function Summary({ draft, ciudad, rubro, hasPhoto }: SummaryProps) {
  const rows: [string, string][] = [
    ['Nombre',   draft.name],
    ['WhatsApp', draft.whatsapp_number],
    ['Ciudad',   ciudad],
    ['Rubro',    rubro],
    ['Zona',     draft.barrio],
    ['Plan',     draft.subscription_tier_id || 'básico'],
    ['Foto',     hasPhoto ? 'sí' : 'después'],
  ]
  return (
    <div className="rounded-[--radius-lg] border border-[--color-line] bg-[--color-sombra] p-4 flex flex-col gap-1.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-xs font-bold tracking-[0.1em] uppercase text-[--color-muted]">{k}</span>
          <span className="text-[--color-nieve] font-medium text-right truncate">{v}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Íconos ──────────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconSend() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}

function IconCamera() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
