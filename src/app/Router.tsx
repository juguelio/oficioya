import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy } from 'react'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'

const HomePage           = lazy(() => import('@/features/search/components/HomePage').then(m => ({ default: m.HomePage })))
const RubroPage          = lazy(() => import('@/features/search/components/RubroPage').then(m => ({ default: m.RubroPage })))
const ProviderProfile    = lazy(() => import('@/features/providers/components/ProviderProfile').then(m => ({ default: m.ProviderProfile })))
const PricingPage        = lazy(() => import('@/features/subscriptions/components/PricingPage').then(m => ({ default: m.PricingPage })))
const EmergencyPage      = lazy(() => import('@/features/search/components/EmergencyPage').then(m => ({ default: m.EmergencyPage })))
const OnboardingPage     = lazy(() => import('@/features/auth/components/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const VerificationPage   = lazy(() => import('@/features/auth/components/VerificationPage').then(m => ({ default: m.VerificationPage })))
const ProviderSignup     = lazy(() => import('@/pages/ProviderSignup').then(m => ({ default: m.ProviderSignup })))
const ProviderLogin      = lazy(() => import('@/pages/ProviderLogin').then(m => ({ default: m.ProviderLogin })))
const ProviderDashboard  = lazy(() => import('@/pages/ProviderDashboard').then(m => ({ default: m.ProviderDashboard })))

export const router = createBrowserRouter([
  // Auth
  { path: '/onboarding',         element: <OnboardingPage /> },
  { path: '/registro/prestador', element: <ProviderSignup /> },
  { path: '/verificacion',       element: <VerificationPage /> },
  { path: '/login',              element: <ProviderLogin /> },
  { path: '/registrarme',        element: <Navigate to="/registro/prestador" replace /> },

  // App
  { path: '/',                   element: <HomePage /> },
  { path: '/:ciudad/:rubro',     element: <RubroPage /> },
  { path: '/prestador/:id',      element: <ProviderProfile /> },
  { path: '/planes',             element: <PricingPage /> },
  { path: '/emergencias',        element: <EmergencyPage /> },

  // Protected
  { path: '/dashboard',          element: <ProtectedRoute><ProviderDashboard /></ProtectedRoute> },
])
