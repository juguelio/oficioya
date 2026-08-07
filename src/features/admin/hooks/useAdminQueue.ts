import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CiudadId, RubroId } from '@/design-system/tokens'
import type { QueueProvider } from '@/features/admin/types'

type QueueRow = {
  id: string; name: string; ciudad_id: string; rubro_id: string
  whatsapp_number: string | null; bio: string | null; is_verified: boolean
  claimed_at: string | null; created_at: string
  docs: { path: string; subido: string }[]
}

// Cola de verificación. Todo el control de acceso vive en la base
// (`is_admin()` dentro de los RPC): si no sos admin, la cola llega vacía.
// Nada de esconder un botón en el cliente y llamarlo seguridad.
export function useAdminQueue() {
  const [providers, setProviders] = useState<QueueProvider[]>([])
  const [isAdmin, setIsAdmin]     = useState<boolean | null>(null)
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: adminData }, { data: queueData }] = await Promise.all([
      supabase.rpc('is_admin'),
      supabase.rpc('admin_provider_queue'),
    ])
    setIsAdmin(adminData === true)
    const rows = (queueData ?? []) as QueueRow[]
    setProviders(rows.map(r => ({
      id: r.id, name: r.name,
      ciudad: r.ciudad_id as CiudadId, rubro: r.rubro_id as RubroId,
      whatsappNumber: r.whatsapp_number, bio: r.bio,
      isVerified: r.is_verified, claimedAt: r.claimed_at, createdAt: r.created_at,
      docs: r.docs ?? [],
    })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Marca o desmarca el badge de verificado. Optimista: el chequeo real de
  // permisos ya lo hizo la base, así que si falla se revierte y se avisa.
  async function setVerified(providerId: string, verified: boolean): Promise<boolean> {
    setProviders(prev => prev.map(p => (p.id === providerId ? { ...p, isVerified: verified } : p)))
    const { data, error } = await supabase.rpc('admin_set_verified', {
      p_provider_id: providerId,
      p_verified:    verified,
    })
    const res = data as { ok?: boolean; error?: string } | null
    if (error || !res?.ok) {
      setProviders(prev => prev.map(p => (p.id === providerId ? { ...p, isVerified: !verified } : p)))
      return false
    }
    return true
  }

  // URL firmada de corta vida: los documentos son privados y así siguen.
  async function abrirDocumento(path: string): Promise<string | null> {
    const { data } = await supabase.storage.from('provider-docs').createSignedUrl(path, 120)
    return data?.signedUrl ?? null
  }

  return { providers, isAdmin, loading, setVerified, abrirDocumento, refetch: load }
}
