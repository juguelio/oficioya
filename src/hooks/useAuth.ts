import { useSyncExternalStore } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthState = {
  user:    User | null
  session: Session | null
  loading: boolean
}

// ─── Store compartido de sesión ────────────────────────────────────────────────
// UN solo estado de auth para toda la app. Antes cada componente que llamaba
// useAuth() tenía su propia copia del estado y su propia suscripción a Supabase:
// el header podía creer una cosa y el guard otra, y `loading` podía quedar
// colgado en true porque onAuthStateChange hacía setState(prev => ...) sin
// tocarlo jamás. Acá CUALQUIER evento de auth (INITIAL_SESSION incluido, que
// supabase-js v2 emite apenas termina de inicializar — también después del
// intercambio del code de OAuth) resuelve `loading` y actualiza a todos los
// componentes suscriptos a la vez.

let state: AuthState = { user: null, session: null, loading: true }

const listeners = new Set<() => void>()

function setState(next: AuthState) {
  state = next
  listeners.forEach(l => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function getSnapshot(): AuthState {
  return state
}

// Arranca al cargar el módulo, igual que el cliente de Supabase.
supabase.auth.onAuthStateChange((_event, session) => {
  setState({ user: session?.user ?? null, session, loading: false })
})

// Cinturón y tiradores: si el evento inicial no llegara por lo que sea,
// getSession() resuelve desde localStorage y baja `loading` igual.
supabase.auth.getSession().then(({ data: { session } }) => {
  if (state.loading) {
    setState({ user: session?.user ?? null, session, loading: false })
  }
})

// ─── Acciones ─────────────────────────────────────────────────────────────────

async function signUp(email: string, password: string, meta: Record<string, string>) {
  // Limpia cualquier sesión colgada ANTES del alta: si quedara una sesión vieja,
  // la cuenta nueva se mezclaría con el usuario anterior. OJO: un flujo que llega
  // acá CON sesión válida (Google) no debe llamar signUp — el onboarding espera
  // `loading` y usa el camino con sesión, que inserta la fila directamente.
  await supabase.auth.signOut({ scope: 'local' })
  return supabase.auth.signUp({
    email,
    password,
    options: { data: meta },
  })
}

async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

async function signInWithGoogle(next?: string) {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Vuelve al panel luego del intercambio OAuth. Esta URL debe estar
      // incluida en Redirect URLs de Supabase Auth. /dashboard es además el
      // único punto que decide a dónde sigue el usuario según tenga o no fila
      // en providers (panel de prestador vs onboarding vs panel de cliente).
      // `next` permite que el alta de cliente vuelva directo a /mis-trabajos.
      redirectTo: `${window.location.origin}${next ?? '/dashboard'}`,
    },
  })
}

// Marca a qué vino la cuenta. Las cuentas de Google llegan sin declararlo, y
// hasta ahora TODA cuenta se asumía prestador: un cliente que entraba terminaba
// en el onboarding de alta de prestador, sin salida.
async function setAccountType(type: 'cliente' | 'prestador') {
  return supabase.auth.updateUser({ data: { account_type: type } })
}

async function signOut() {
  return supabase.auth.signOut()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { ...snapshot, signUp, signIn, signInWithGoogle, signOut, setAccountType }
}
