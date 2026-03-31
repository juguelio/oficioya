// ─── Ciudades ────────────────────────────────────────────────────────────────

export const ciudades = [
  { id: 'san-martin',         label: 'San Martín de los Andes', cp: '8370', lat: -40.1573, lng: -71.3520 },
  { id: 'villa-la-angostura', label: 'Villa La Angostura',      cp: '8407', lat: -40.7583, lng: -71.6466 },
  { id: 'bariloche',          label: 'Bariloche',               cp: '8400', lat: -41.1335, lng: -71.3103 },
] as const

export type CiudadId = typeof ciudades[number]['id']

// ─── Rubros ──────────────────────────────────────────────────────────────────

export const rubros = [
  { id: 'electricista',    label: 'Electricista',    icon: '⚡' },
  { id: 'plomero',         label: 'Plomero',         icon: '🔧' },
  { id: 'gasista',         label: 'Gasista',         icon: '🔥' },
  { id: 'carpintero',      label: 'Carpintero',      icon: '🪚' },
  { id: 'albanil',         label: 'Albañil',         icon: '🧱' },
  { id: 'pintor',          label: 'Pintor',          icon: '🖌️' },
  { id: 'cerrajero',       label: 'Cerrajero',       icon: '🔑' },
  { id: 'jardinero',       label: 'Jardinero',       icon: '🌿' },
  { id: 'calefaccionista', label: 'Calefaccionista', icon: '♨️' },
  { id: 'herrero',         label: 'Herrero',         icon: '⚙️' },
  { id: 'techista',        label: 'Techista',              icon: '🏗️' },
  { id: 'tecnico-pc',      label: 'Técnico en PC',         icon: '💻' },
  { id: 'flete',           label: 'Flete / Mudanza',       icon: '🚛' },
  { id: 'leniero',         label: 'Leñero',                icon: '🪵' },
  { id: 'limpieza',        label: 'Limpieza',              icon: '🧹' },
  { id: 'cabanas',         label: 'Mant. de cabañas',      icon: '🏕️' },
] as const

export type RubroId = typeof rubros[number]['id']

// ─── Colores (JS mirror de theme.css) ────────────────────────────────────────

export const colors = {
  bosqueDk: '#1E3A1E',
  bosqueLt: '#4A8C49',
  sombra:   '#141E14',
  nieve:    '#EFF3EE',
  muted:    '#7A9A79',
  lago:     '#2E6E8A',
} as const
