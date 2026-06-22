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

export type NewJobAlertPayload = {
  jobId:  string
  title:  string
  rubro:  string
  ciudad: string
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

// ─── sendNewJobAlert ───────────────────────────────────────────────────────────
// Avisa a n8n que se publicó un trabajo, para notificar a prestadores activos del
// mismo rubro/ciudad (workflow 05-job-notify). Fire-and-forget.

export async function sendNewJobAlert(payload: NewJobAlertPayload): Promise<void> {
  const url = import.meta.env.VITE_N8N_WEBHOOK_NEW_JOB as string | undefined

  if (!url) {
    console.error('[notifications] VITE_N8N_WEBHOOK_NEW_JOB no está configurado — se omite el aviso de trabajo.')
    return
  }

  try {
    await postWebhook(url, {
      job_id:    payload.jobId,
      title:     payload.title,
      rubro:     payload.rubro,
      ciudad:    payload.ciudad,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[notifications] Error al enviar aviso de nuevo trabajo:', err)
  }
}
