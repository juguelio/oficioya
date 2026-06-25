// Edge Function — crea una suscripción mensual (MercadoPago preapproval, débito automático)
// para el prestador LOGUEADO. La identidad sale del JWT de Supabase (no del body): así un
// caller no puede suscribir a un prestador ajeno (IDOR). El MP_ACCESS_TOKEN vive SÓLO acá.
//
// Deploy: supabase functions deploy subscription-checkout
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
    const { tierId } = await req.json()
    if (!tierId) return json({ error: 'missing_params' }, 400)

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) return json({ error: 'mp_not_configured' }, 503)

    const appUrl = Deno.env.get('APP_URL') ?? new URL(req.url).origin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    // Identidad real desde el JWT del prestador (no se confía en el body).
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'unauthorized' }, 401)

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: provider } = await admin
      .from('providers')
      .select('id, status')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    if (!provider) return json({ error: 'provider_unavailable' }, 404)

    const { data: tier } = await admin
      .from('subscription_tiers')
      .select('id, label, price_ars')
      .eq('id', tierId)
      .maybeSingle()
    if (!tier) return json({ error: 'tier_unknown' }, 404)

    const { data: sub, error: insErr } = await admin
      .from('provider_subscriptions')
      .insert({ provider_id: provider.id, tier_id: tier.id, status: 'pending' })
      .select('id')
      .single()
    if (insErr || !sub) return json({ error: 'could_not_create' }, 500)

    const pre = {
      reason: `Oficio — Plan ${tier.label}`,
      external_reference: sub.id,
      payer_email: user.email ?? undefined,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: tier.price_ars,
        currency_id: 'ARS',
      },
      back_url: `${appUrl}/dashboard?sub=ok`,
      status: 'pending',
    }

    const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(pre),
    })
    const mp = await mpRes.json()
    if (!mpRes.ok || !mp.init_point) return json({ error: 'mp_error', detail: mp }, 502)

    await admin
      .from('provider_subscriptions')
      .update({ mp_preapproval_id: String(mp.id ?? '') })
      .eq('id', sub.id)

    return json({ init_point: mp.init_point })
  } catch (_e) {
    return json({ error: 'bad_request' }, 400)
  }
})
