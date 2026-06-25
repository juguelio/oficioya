import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, hasMapsKey } from '@/features/search/utils/loadGoogleMaps'
import { colors } from '@/design-system/tokens'
import { cn } from '@/shared/utils/cn'
import type { EmergencyProvider } from '@/features/search/hooks/useEmergencyProviders'

type LatLng = { lat: number; lng: number }

type EmergencyMapProps = {
  center: LatLng
  providers: EmergencyProvider[]
  userLoc?: LatLng | null
  activeId?: string | null
  onSelect?: (id: string) => void
  className?: string
}

// Estilo oscuro inline (combina con --color-noche #0E1510). Usamos la API clásica de Map +
// Marker: el estilo por código no necesita un mapId de la nube (que Advanced Markers sí exige
// y obligaría a configurar el estilo en Google Cloud Console). Menos fricción de setup.
const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0e1510' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a9a79' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e1510' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2a1a' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#09110b' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#0e1510' }] },
]

function pinIcon(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 24 16 24s16-13 16-24C32 7.2 24.8 0 16 0z" fill="${color}"/>
    <circle cx="16" cy="16" r="6" fill="#0e1510"/></svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

export function EmergencyMap({ center, providers, userLoc, activeId, onSelect, className }: EmergencyMapProps) {
  const divRef     = useRef<HTMLDivElement>(null)
  const mapRef     = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  // Init del mapa (una vez)
  useEffect(() => {
    let cancelled = false
    if (!hasMapsKey()) { setStatus('error'); return }

    loadGoogleMaps()
      .then(google => {
        if (cancelled || !divRef.current) return
        mapRef.current = new google.maps.Map(divRef.current, {
          center: userLoc ?? center,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: DARK_STYLE,
          backgroundColor: '#0e1510',
        })
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('error') })

    return () => { cancelled = true }
    // center/userLoc sólo importan para el centro inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Marcadores de prestadores en guardia
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map) return
    const g = google
    const live = markersRef.current

    const wanted = new Set(providers.filter(p => p.lat != null && p.lng != null).map(p => p.id))
    // Sacar markers que ya no están
    for (const [id, marker] of live) {
      if (!wanted.has(id)) { marker.setMap(null); live.delete(id) }
    }
    // Agregar/actualizar
    providers.forEach(p => {
      if (p.lat == null || p.lng == null) return
      let marker = live.get(p.id)
      if (!marker) {
        marker = new g.maps.Marker({
          map,
          position: { lat: p.lat, lng: p.lng },
          title: p.name,
          icon: { url: pinIcon(colors.emergency), scaledSize: new g.maps.Size(32, 40), anchor: new g.maps.Point(16, 40) },
        })
        marker.addListener('click', () => onSelect?.(p.id))
        live.set(p.id, marker)
      } else {
        marker.setPosition({ lat: p.lat, lng: p.lng })
      }
    })

    // Marker del usuario (si dio geo)
    const ME = '__me__'
    if (userLoc) {
      let me = live.get(ME)
      if (!me) {
        me = new g.maps.Marker({
          map,
          position: userLoc,
          title: 'Tu ubicación',
          icon: { path: g.maps.SymbolPath.CIRCLE, scale: 7, fillColor: colors.lago, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
          zIndex: 999,
        })
        live.set(ME, me)
      } else {
        me.setPosition(userLoc)
      }
    }
  }, [providers, userLoc, status, onSelect])

  // Resaltar el activo: centrar + bounce corto
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map || !activeId) return
    const marker = markersRef.current.get(activeId)
    const g = google
    if (marker && marker.getPosition()) {
      map.panTo(marker.getPosition()!)
      marker.setAnimation(g.maps.Animation.BOUNCE)
      const t = setTimeout(() => marker!.setAnimation(null), 700)
      return () => clearTimeout(t)
    }
  }, [activeId, status])

  if (status === 'error') {
    return (
      <div
        className={cn('flex items-center justify-center text-center px-8', className)}
        style={{ backgroundColor: 'var(--color-noche)' }}
      >
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {hasMapsKey()
            ? 'No se pudo cargar el mapa. Revisá tu conexión.'
            : 'Mapa no disponible — falta configurar la clave de Google Maps.'}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div ref={divRef} className="absolute inset-0" />
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: 'var(--color-sombra)' }} />
      )}
    </div>
  )
}
