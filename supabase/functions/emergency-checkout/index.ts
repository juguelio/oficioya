// Supabase Edge Function — crea una preference de MercadoPago Checkout Pro para el
// contacto de urgencia (§8). Devuelve el init_point al que redirige el browser.
// El MP_ACCESS_TOKEN vive SÓLO acá (server-side), nunca en el bundle del browser.
//
// Deploy:  supabase functions deploy emergency-checkout
// Secrets: supabase secrets set MP_ACCESS_TOKEN=... APP_URL=https://oficioya.app
//          (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya existen en el entorno de functions)
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
    const { providerId, buyerPhone } = await req.json()
    if (!providerId) return json({ error: 'missing_provider' }, 400)

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) return json({ error: 'mp_not_configured' }, 503)

    const appUrl = Deno.env.get('APP_URL') ?? new URL(req.url).origin
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // El prestador debe existir, estar activo y en guardia.
    const { data: provider } = await supabase
      .from('providers')
      .select('id, name, rubro_id, ciudad_id, is_emergency_available, status')
      .eq('id', providerId)
      .eq('is_emergency_available', true)
      .eq('status', 'active')
      .maybeSingle()

    if (!provider) return json({ error: 'provider_unavailable' }, 404)

    const { data: contact, error: insErr } = await supabase
      .from('emergency_contacts')
      .insert({ provider_id: provider.id, buyer_phone: buyerPhone ?? null })
      .select('reference, amount')
      .single()

    if (insErr || !contact) return json({ error: 'could_not_create_contact' }, 500)

    const pref = {
      items: [{
        title: `Contacto de urgencia — ${provider.rubro_id} en ${provider.ciudad_id}`,
        quantity: 1,
        unit_price: contact.amount,
        currency_id: 'ARS',
      }],
      external_reference: contact.reference,
      back_urls: {
        success: `${appUrl}/emergencias/contacto/${provider.id}?ref=${contact.reference}`,
        failure: `${appUrl}/emergencias/contacto/${provider.id}?ref=${contact.reference}`,
        pending: `${appUrl}/emergencias/contacto/${provider.id}?ref=${contact.reference}`,
      },
      auto_return: 'approved',
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(pref),
    })
    const mp = await mpRes.json()
    if (!mpRes.ok || !mp.init_point) return json({ error: 'mp_error', detail: mp }, 502)

    return json({ init_point: mp.init_point, reference: contact.reference })
  } catch (_e) {
    return json({ error: 'bad_request' }, 400)
  }
})
