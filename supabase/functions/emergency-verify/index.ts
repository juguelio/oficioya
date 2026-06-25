// Supabase Edge Function — verifica con MercadoPago que el pago del contacto de urgencia
// está aprobado y SÓLO entonces revela el WhatsApp del prestador (§8). Idempotente.
//
// Deploy:  supabase functions deploy emergency-verify
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const { reference, paymentId } = await req.json()
    if (!reference) return json({ error: 'missing_reference' }, 400)

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) return json({ error: 'mp_not_configured' }, 503)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: contact } = await supabase
      .from('emergency_contacts')
      .select('id, provider_id, reference, amount, status')
      .eq('reference', reference)
      .maybeSingle()
    if (!contact) return json({ error: 'not_found' }, 404)

    // Buscar el pago en MP: por id directo, o por external_reference.
    const mpHeaders = { Authorization: `Bearer ${mpToken}` }
    let payment: Record<string, unknown> | null = null
    if (paymentId) {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: mpHeaders })
      if (r.ok) payment = await r.json()
    }
    if (!payment) {
      const r = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(reference)}&sort=date_created&criteria=desc`,
        { headers: mpHeaders },
      )
      if (r.ok) {
        const list = await r.json()
        payment = list?.results?.[0] ?? null
      }
    }

    if (!payment) return json({ status: contact.status })

    // Anti-spoofing: el pago tiene que referenciar nuestra reference y cubrir el monto.
    const okRef    = String(payment.external_reference ?? '') === String(reference)
    const okAmount = Number(payment.transaction_amount ?? 0) >= Number(contact.amount)
    const approved = payment.status === 'approved' && okRef && okAmount

    if (!approved) return json({ status: String(payment.status ?? contact.status) })

    if (contact.status !== 'approved') {
      await supabase
        .from('emergency_contacts')
        .update({ status: 'approved', mp_payment_id: String(payment.id ?? ''), paid_at: new Date().toISOString() })
        .eq('id', contact.id)
    }

    const { data: provider } = await supabase
      .from('providers')
      .select('name, whatsapp_number, rubro_id, ciudad_id')
      .eq('id', contact.provider_id)
      .single()

    return json({
      status: 'approved',
      name: provider?.name ?? '',
      whatsapp: provider?.whatsapp_number ?? '',
      rubro: provider?.rubro_id ?? '',
      ciudad: provider?.ciudad_id ?? '',
    })
  } catch (_e) {
    return json({ error: 'bad_request' }, 400)
  }
})
