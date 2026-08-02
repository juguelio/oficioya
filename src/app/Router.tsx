import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { lazy } from 'react'
// No-lazy a propósito: la pantalla de error/404 debe renderizar aunque falle la carga de un chunk.
// ProtectedRoute tampoco es lazy: es el guard de las rutas privadas y decide (esperando
// `loading` de la sesión) antes de que cargue cualquier chunk protegido.
import { NotFoundPage, ProtectedRoute, RootBoundary } from '@/shared/components'

const HomePage           = lazy(() => import('@/features/search/components/HomePage').then(m => ({ default: m.HomePage })))
const RubroPage          = lazy(() => import('@/features/search/components/RubroPage').then(m => ({ default: m.RubroPage })))
const ProviderProfile    = lazy(() => import('@/features/providers/components/ProviderProfile').then(m => ({ default: m.ProviderProfile })))
const PricingPage        = lazy(() => import('@/features/subscriptions/components/PricingPage').then(m => ({ default: m.PricingPage })))
const EmergencyPage      = lazy(() => import('@/features/search/components/EmergencyPage').then(m => ({ default: m.EmergencyPage })))
const EmergencyCheckout  = lazy(() => import('@/features/search/components/EmergencyCheckoutPage').then(m => ({ default: m.EmergencyCheckoutPage })))
const EmergencyContact   = lazy(() => import('@/features/search/components/EmergencyContactPage').then(m => ({ default: m.EmergencyContactPage })))
const OnboardingPage     = lazy(() => import('@/features/auth/components/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const VerificationPage   = lazy(() => import('@/features/auth/components/VerificationPage').then(m => ({ default: m.VerificationPage })))
const ConvOnboarding     = lazy(() => import('@/pages/ConversationalOnboarding').then(m => ({ default: m.ConversationalOnboarding })))
const ProviderLogin      = lazy(() => import('@/pages/ProviderLogin').then(m => ({ default: m.ProviderLogin })))
const ProviderDashboard  = lazy(() => import('@/pages/ProviderDashboard').then(m => ({ default: m.ProviderDashboard })))
const PrivacyPage        = lazy(() => import('@/features/legal/components/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const TermsPage          = lazy(() => import('@/features/legal/components/TermsPage').then(m => ({ default: m.TermsPage })))
const ProviderProfileEdit = lazy(() => import('@/pages/ProviderProfileEdit').then(m => ({ default: m.ProviderProfileEdit })))
const JobsPage           = lazy(() => import('@/features/jobs/components/JobsPage').then(m => ({ default: m.JobsPage })))
const PostJobPage        = lazy(() => import('@/features/jobs/components/PostJobPage').then(m => ({ default: m.PostJobPage })))
const JobDetailPage      = lazy(() => import('@/features/jobs/components/JobDetailPage').then(m => ({ default: m.JobDetailPage })))
const ClaimProfilePage   = lazy(() => import('@/features/auth/components/ClaimProfilePage').then(m => ({ default: m.ClaimProfilePage })))
const ClientSignup       = lazy(() => import('@/pages/ClientSignup').then(m => ({ default: m.ClientSignup })))
const MyJobsPage         = lazy(() => import('@/features/jobs/components/MyJobsPage').then(m => ({ default: m.MyJobsPage })))

export const router = createBrowserRouter([
  {
    // Layout sin path: un solo errorElement cubre todas las rutas hijas (crashes de render/loader).
    element: <Outlet />,
    errorElement: <RootBoundary />,
    children: [
  // Auth
  { path: '/onboarding',         element: <OnboardingPage /> },
  { path: '/registro/prestador', element: <ConvOnboarding /> },
  { path: '/sumarme',            element: <Navigate to="/registro/prestador" replace /> },
  // Onboarding único: el clásico (ProviderSignup) duplicaba validaciones y lógica de
  // alta con el conversacional y ya causó arreglos aplicados en uno solo de los dos.
  // El archivo sigue en src/pages/ por si hay que revivirlo, pero sin ruta.
  { path: '/registro/clasico',   element: <Navigate to="/registro/prestador" replace /> },
  { path: '/verificacion',       element: <VerificationPage /> },
  { path: '/activar/:id',        element: <ClaimProfilePage /> },
  { path: '/login',              element: <ProviderLogin /> },
  { path: '/registrarme',        element: <Navigate to="/registro/prestador" replace /> },
  // Cuenta de cliente: opcional. Publicar un trabajo sigue sin requerir cuenta;
  // esto es para no depender del link privado y ver todo junto en /mis-trabajos.
  { path: '/registro/cliente',   element: <ClientSignup /> },

  // App
  { path: '/',                   element: <HomePage /> },
  { path: '/:ciudad/:rubro',     element: <RubroPage /> },
  { path: '/prestador/:id',      element: <ProviderProfile /> },
  { path: '/planes',             element: <PricingPage /> },
  { path: '/emergencias',                element: <EmergencyPage /> },
  { path: '/emergencias/contratar/:id',  element: <EmergencyCheckout /> },
  { path: '/emergencias/contacto/:id',   element: <EmergencyContact /> },

  // Trabajos (jobs + presupuestos) — backend Supabase
  { path: '/trabajos',           element: <JobsPage /> },
  { path: '/trabajos/nuevo',     element: <PostJobPage /> },
  { path: '/trabajos/:id',       element: <JobDetailPage /> },
  // Panel del CLIENTE (equivalente a /dashboard para prestadores).
  { path: '/mis-trabajos',       element: <ProtectedRoute><MyJobsPage /></ProtectedRoute> },

  // Dashboard prestador. ProtectedRoute espera `loading` y exige sesión (en dev deja
  // pasar sin sesión para el selector mock). /dashboard es además el único punto que
  // decide el destino post-login: sesión + fila en providers → panel; sesión sin
  // fila → /registro/prestador; sin sesión → /login.
  { path: '/dashboard',          element: <ProtectedRoute><ProviderDashboard /></ProtectedRoute> },
  { path: '/perfil',             element: <ProtectedRoute><ProviderProfileEdit /></ProtectedRoute> },

  // Legales — la política de privacidad es además requisito de Google para verificar
  // la pantalla de consentimiento del login con Google.
  { path: '/privacidad',         element: <PrivacyPage /> },
  { path: '/terminos',           element: <TermsPage /> },

  // Catch-all: cualquier URL desconocida → 404 branded (no la pantalla de dev de React Router).
  { path: '*',                   element: <NotFoundPage /> },
    ],
  },
])
