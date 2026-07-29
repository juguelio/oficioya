import type { AuthError, AuthResponse } from '@supabase/supabase-js'

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
