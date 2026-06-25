import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { lazy } from 'react'
// No-lazy a propósito: la pantalla de error/404 debe renderizar aunque falle la carga de un chunk.
import { NotFoundPage, RootBoundary } from '@/shared/components'

const HomePage           = lazy(() => import('@/features/search/components/HomePage').then(m => ({ default: m.HomePage })))
const RubroPage          = lazy(() => import('@/features/search/components/RubroPage').then(m => ({ default: m.RubroPage })))
const ProviderProfile    = lazy(() => import('@/features/providers/components/ProviderProfile').then(m => ({ default: m.ProviderProfile })))
const PricingPage        = lazy(() => import('@/features/subscriptions/components/PricingPage').then(m => ({ default: m.PricingPage })))
const EmergencyPage      = lazy(() => import('@/features/search/components/EmergencyPage').then(m => ({ default: m.EmergencyPage })))
const EmergencyCheckout  = lazy(() => import('@/features/search/components/EmergencyCheckoutPage').then(m => ({ default: m.EmergencyCheckoutPage })))
const EmergencyContact   = lazy(() => import('@/features/search/components/EmergencyContactPage').then(m => ({ default: m.EmergencyContactPage })))
const OnboardingPage     = lazy(() => import('@/features/auth/components/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const VerificationPage   = lazy(() => import('@/features/auth/components/VerificationPage').then(m => ({ default: m.VerificationPage })))
const ProviderSignup     = lazy(() => import('@/pages/ProviderSignup').then(m => ({ default: m.ProviderSignup })))
const ConvOnboarding     = lazy(() => import('@/pages/ConversationalOnboarding').then(m => ({ default: m.ConversationalOnboarding })))
const ProviderLogin      = lazy(() => import('@/pages/ProviderLogin').then(m => ({ default: m.ProviderLogin })))
const ProviderDashboard  = lazy(() => import('@/pages/ProviderDashboard').then(m => ({ default: m.ProviderDashboard })))
const JobsPage           = lazy(() => import('@/features/jobs/components/JobsPage').then(m => ({ default: m.JobsPage })))
const PostJobPage        = lazy(() => import('@/features/jobs/components/PostJobPage').then(m => ({ default: m.PostJobPage })))
const JobDetailPage      = lazy(() => import('@/features/jobs/components/JobDetailPage').then(m => ({ default: m.JobDetailPage })))
const ClaimProfilePage   = lazy(() => import('@/features/auth/components/ClaimProfilePage').then(m => ({ default: m.ClaimProfilePage })))

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
  { path: '/registro/clasico',   element: <ProviderSignup /> },
  { path: '/verificacion',       element: <VerificationPage /> },
  { path: '/activar/:id',        element: <ClaimProfilePage /> },
  { path: '/login',              element: <ProviderLogin /> },
  { path: '/registrarme',        element: <Navigate to="/registro/prestador" replace /> },

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

  // Dashboard prestador (fase 1: auth mock vía store)
  { path: '/dashboard',          element: <ProviderDashboard /> },

  // Catch-all: cualquier URL desconocida → 404 branded (no la pantalla de dev de React Router).
  { path: '*',                   element: <NotFoundPage /> },
    ],
  },
])
