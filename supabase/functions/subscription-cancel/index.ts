// Edge Function — cancela la suscripción del prestador LOGUEADO. La identidad se deriva del
// JWT de Supabase (no del body): se resuelve el provider por auth_user_id y se cancela su
// preapproval en MP. El webhook posterior refleja el estado final (fuente de verdad = MP).
//
// Deploy: supabase functions deploy subscription-cancel
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
    const authHeader = req.headers.get('Authorization') ?? ''
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) return json({ error: 'mp_not_configured' }, 503)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // Cliente con el JWT del usuario → resuelve identidad real.
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'unauthorized' }, 401)

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: provider } = await admin
      .from('providers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    if (!provider) return json({ error: 'no_provider' }, 404)

    const { data: sub } = await admin
      .from('provider_subscriptions')
      .select('id, mp_preapproval_id')
      .eq('provider_id', provider.id)
      .in('status', ['authorized', 'paused', 'pending'])
      .order('created_at', { ascending: false })
      .maybeSingle()
    if (!sub?.mp_preapproval_id) return json({ error: 'no_active_subscription' }, 404)

    const r = await fetch(`https://api.mercadopago.com/preapproval/${sub.mp_preapproval_id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    if (!r.ok) return json({ error: 'mp_error' }, 502)

    return json({ ok: true })
  } catch (_e) {
    return json({ error: 'bad_request' }, 400)
  }
})
