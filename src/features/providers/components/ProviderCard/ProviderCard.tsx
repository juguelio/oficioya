import { Card, Avatar, Badge, StarRating, Button } from '@/shared/components'
import { cn } from '@/shared/utils/cn'
import { formatDistance } from '@/shared/utils/distance'
import { rubros } from '@/design-system/tokens'
import type { Provider } from '@/features/providers/types'

type ProviderCardProps = {
  provider: Provider
  distanceKm?: number
  className?: string
}

function getWhatsAppLink(phone: string, name: string): string {
  const number = phone.replace(/\D/g, '')
  const text = encodeURIComponent(`Hola ${name.split(' ')[0]}, te contacto desde Oficio 👋`)
  return `https://wa.me/${number}?text=${text}`
}

export function ProviderCard({ provider, distanceKm, className }: ProviderCardProps) {
  const rubro = rubros.find(r => r.id === provider.rubro)
  const waLink = getWhatsAppLink(provider.phone, provider.name)

  return (
    <Card hoverable className={cn('flex flex-col gap-3', className)}>

      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={provider.name} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-[--color-nieve] truncate">
              {provider.name}
            </h3>
            {provider.isVerified && (
              <Badge variant="verified">✓ verificado</Badge>
            )}
            {provider.subscription === 'destacado' && (
              <Badge variant="destacado">★ destacado</Badge>
            )}
          </div>

          <p className="text-sm text-[--color-muted] mt-0.5 truncate">
            {rubro?.icon} {rubro?.label}
            {provider.barrio && ` · ${provider.barrio}`}
            {distanceKm !== undefined && (
              <span className="text-[--color-bosque-lt]"> · {formatDistance(distanceKm)}</span>
            )}
          </p>
        </div>

        <StarRating value={provider.rating} />
      </div>

      {/* Bio */}
      {provider.bio && (
        <p className="text-sm text-[--color-muted] leading-relaxed line-clamp-2">
          {provider.bio}
        </p>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-xs text-[--color-muted]" style={{ fontFamily: 'var(--font-mono)' }}>
        <span>
          <span className="text-[--color-nieve] font-semibold">{provider.totalJobs}</span> trabajos
        </span>
        <span>
          <span className="text-[--color-nieve] font-semibold">{provider.rating.toFixed(1)}</span> puntos
        </span>
      </div>

      {/* CTA */}
      <Button variant="whatsapp" size="full" href={waLink}>
        <WhatsAppIcon />
        Contactar por WhatsApp
      </Button>

    </Card>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L.057 23.882l6.2-1.625A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.368l-.36-.214-3.68.965.981-3.595-.234-.369A9.818 9.818 0 1112 21.818z"/>
    </svg>
  )
}
