export type CertType =
  | 'dni'
  | 'matricula'
  | 'habilitacion'
  | 'seguro'
  | 'certificado_curso'

export type Certification = {
  id: string
  providerId: string
  type: CertType
  fileName: string   // solo metadata — el archivo no se persiste en localStorage
  status: 'verified' // en fase 1 la verificación es instantánea
  points: number
  uploadedAt: string // ISO
}

export type Review = {
  id: string
  providerId: string
  authorName: string
  rating: number     // 1–5
  comment: string
  createdAt: string  // ISO
}

// ─── Configuración de tipos de certificación ──────────────────────────────────

export type CertConfig = {
  type: CertType
  label: string
  description: string
  icon: string
  points: number
}

export const CERT_CONFIGS: CertConfig[] = [
  {
    type:        'dni',
    label:       'DNI / Documento',
    description: 'Verificación de identidad',
    icon:        '🪪',
    points:      10,
  },
  {
    type:        'matricula',
    label:       'Matrícula profesional',
    description: 'Habilitación para ejercer el oficio',
    icon:        '📜',
    points:      30,
  },
  {
    type:        'habilitacion',
    label:       'Habilitación municipal',
    description: 'Permiso vigente de la municipalidad',
    icon:        '🏛️',
    points:      25,
  },
  {
    type:        'seguro',
    label:       'Seguro de responsabilidad civil',
    description: 'Cobertura ante daños a terceros',
    icon:        '🛡️',
    points:      20,
  },
  {
    type:        'certificado_curso',
    label:       'Certificado de capacitación',
    description: 'Cursos o formación técnica formal',
    icon:        '🎓',
    points:      15,
  },
]

// Score máximo: 100 pts (suma de todos los CERT_CONFIGS)
export const MAX_CERT_SCORE = CERT_CONFIGS.reduce((s, c) => s + c.points, 0) // = 100

export type TrustBadge = {
  label:       string
  icon:        string
  color:       string
  bgColor:     string
  minScore:    number
}

export const TRUST_BADGES: TrustBadge[] = [
  { label: 'Sin verificar',           icon: '○',  color: 'var(--color-muted)',   bgColor: 'rgba(0,0,0,0.05)', minScore: 0  },
  { label: 'Verificado',              icon: '✓',  color: 'var(--color-bosque-lt)', bgColor: 'var(--color-brand-tint)', minScore: 20 },
  { label: 'Profesional verificado',  icon: '⭐', color: '#2E6E8A',              bgColor: '#2E6E8A22',       minScore: 50 },
  { label: 'Prestador de confianza',  icon: '🏆', color: '#C48A00',              bgColor: '#F5C84222',       minScore: 80 },
]

export function getTrustBadge(score: number): TrustBadge {
  return [...TRUST_BADGES].reverse().find(b => score >= b.minScore)!
}
