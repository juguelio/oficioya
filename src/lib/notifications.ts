// ─── Payload types ─────────────────────────────────────────────────────────────

export type WelcomeEmailPayload = {
  email:  string
  name:   string
  plan:   string
  ciudad: string
}

export type NewProviderAlertPayload = {
  name:   string
  email:  string
  rubro:  string
  ciudad: string
  plan:   string
}

// ─── Internal helper ───────────────────────────────────────────────────────────

async function postWebhook(url: string, body: Record<string, string>): Promise<void> {
  await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── sendWelcomeEmail ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
  const url = import.meta.env.VITE_N8N_WEBHOOK_WELCOME_EMAIL as string | undefined

  if (!url) {
    console.error('[notifications] VITE_N8N_WEBHOOK_WELCOME_EMAIL no está configurado — se omite el envío.')
    return
  }

  try {
    await postWebhook(url, {
      email:     payload.email,
      name:      payload.name,
      plan:      payload.plan,
      ciudad:    payload.ciudad,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[notifications] Error al enviar welcome email:', err)
  }
}

// ─── sendNewProviderAlert ──────────────────────────────────────────────────────

export async function sendNewProviderAlert(payload: NewProviderAlertPayload): Promise<void> {
  const url = import.meta.env.VITE_N8N_WEBHOOK_NEW_PROVIDER as string | undefined

  if (!url) {
    console.error('[notifications] VITE_N8N_WEBHOOK_NEW_PROVIDER no está configurado — se omite el alerta.')
    return
  }

  try {
    await postWebhook(url, {
      name:      payload.name,
      email:     payload.email,
      rubro:     payload.rubro,
      ciudad:    payload.ciudad,
      plan:      payload.plan,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[notifications] Error al enviar alerta de nuevo prestador:', err)
  }
}
