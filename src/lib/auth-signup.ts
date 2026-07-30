import type { AuthError, AuthResponse } from '@supabase/supabase-js'

// ⚠️ Este texto NO debe confirmar que el email ya está registrado.
// `identities: []` es la señal que Supabase emite justamente para OCULTAR un alta
// duplicada y evitar enumeración de emails. Necesitamos detectarla para no mandar al
// prestador a /verificacion sin cuenta, pero el mensaje tiene que quedar ambiguo entre
// "el email está mal escrito" y "ya existe". Si lo cambiás por algo tipo "ese email ya
// está registrado", cualquiera puede sondear la base y averiguar quién tiene cuenta.
// El cierre real de la enumeración es activar "Confirm email" en Supabase Auth: ahí el
// alta nunca devuelve sesión inmediata y los dos casos son indistinguibles.
const DUPLICATE_SIGNUP_MESSAGE = 'No pudimos crear una cuenta nueva con ese email. Si lo escribiste mal, probá con otro; si ya tenés cuenta, iniciá sesión.'

export function isObfuscatedDuplicateSignUp(data: AuthResponse['data']) {
  const identities = data.user?.identities
  return Array.isArray(identities) && identities.length === 0
}

export function signUpErrorMessage(error: AuthError | null, data?: AuthResponse['data']) {
  if (error?.message === 'User already registered' || isObfuscatedDuplicateSignUp(data ?? { user: null, session: null })) {
    return DUPLICATE_SIGNUP_MESSAGE
  }

  return error?.message ?? null
}
