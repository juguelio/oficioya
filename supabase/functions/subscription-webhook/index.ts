// Edge Function — webhook de MercadoPago para suscripciones. Ante cada notificación lee el
// preapproval directo de la API de MP (anti-spoofing) y sincroniza provider_subscriptions +
// el entitlement providers.subscription_tier_id. Idempotente. Sin verify_jwt (MP no manda JWT).
//
// Deploy: supabase functions deploy subscription-webhook --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ok = () => new Response('ok', { status: 200 })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return ok()
  try {
    const body = await req.json().catch(() => ({}))
    const url = new URL(req.url)
    const type = body.type ?? body.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic') ?? ''
    const id = body?.data?.id ?? url.searchParams.get('id') ?? body?.id
    if (!id) return ok()

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) return ok()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const auth = { Authorization: `Bearer ${mpToken}` }

    // Resolver el preapproval. Si la notificación es de un cobro recurrente, sacamos el
    // preapproval_id del authorized_payment.
    let preapprovalId = String(id)
    if (String(type).includes('authorized_payment')) {
      const r = await fetch(`https://api.mercadopago.com/authorized_payments/${id}`, { headers: auth })
      if (r.ok) {
        const ap = await r.json()
        preapprovalId = String(ap.preapproval_id ?? preapprovalId)
      }
    }

    const pr = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, { headers: auth })
    if (!pr.ok) return ok()
    const pre = await pr.json()
    const ref = String(pre.external_reference ?? '')
    if (!ref) return ok()

    const statusMap: Record<string, string> = {
      authorized: 'authorized',
      paused: 'paused',
      cancelled: 'cancelled',
      pending: 'pending',
    }
    const status = statusMap[String(pre.status)] ?? 'pending'
    const nextEnd = pre.next_payment_date ? new Date(pre.next_payment_date).toISOString() : null

    const { data: sub } = await supabase
      .from('provider_subscriptions')
      .select('id, provider_id, tier_id')
      .eq('id', ref)
      .maybeSingle()
    if (!sub) return ok()

    await supabase
      .from('provider_subscriptions')
      .update({ status, current_period_end: nextEnd, mp_preapproval_id: preapprovalId, updated_at: new Date().toISOString() })
      .eq('id', sub.id)

    // Entitlement: authorized → set tier; cualquier otro estado → sin placement premium.
    await supabase
      .from('providers')
      .update({ subscription_tier_id: status === 'authorized' ? sub.tier_id : null })
      .eq('id', sub.provider_id)

    return ok()
  } catch (_e) {
    return ok()
  }
})
