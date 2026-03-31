import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy } from 'react'

const HomePage              = lazy(() => import('@/features/search/components/HomePage').then(m => ({ default: m.HomePage })))
const RubroPage             = lazy(() => import('@/features/search/components/RubroPage').then(m => ({ default: m.RubroPage })))
const ProviderProfile       = lazy(() => import('@/features/providers/components/ProviderProfile').then(m => ({ default: m.ProviderProfile })))
const PricingPage           = lazy(() => import('@/features/subscriptions/components/PricingPage').then(m => ({ default: m.PricingPage })))
const RegisterPage          = lazy(() => import('@/features/auth/components/RegisterPage').then(m => ({ default: m.RegisterPage })))
const EmergencyPage         = lazy(() => import('@/features/search/components/EmergencyPage').then(m => ({ default: m.EmergencyPage })))
const OnboardingPage        = lazy(() => import('@/features/auth/components/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const ProviderRegisterPage  = lazy(() => import('@/features/auth/components/ProviderRegisterPage').then(m => ({ default: m.ProviderRegisterPage })))
const VerificationPage      = lazy(() => import('@/features/auth/components/VerificationPage').then(m => ({ default: m.VerificationPage })))

export const router = createBrowserRouter([
  // Auth / onboarding
  { path: '/onboarding',            element: <OnboardingPage /> },
  { path: '/registro/prestador',    element: <ProviderRegisterPage /> },
  { path: '/verificacion',          element: <VerificationPage /> },
  { path: '/registrarme',           element: <Navigate to="/registro/prestador" replace /> },
  { path: '/login',                 element: <RegisterPage /> },   // placeholder until LoginPage exists

  // App
  { path: '/',                      element: <HomePage /> },
  { path: '/:ciudad/:rubro',        element: <RubroPage /> },
  { path: '/prestador/:id',         element: <ProviderProfile /> },
  { path: '/planes',                element: <PricingPage /> },
  { path: '/emergencias',           element: <EmergencyPage /> },
])
