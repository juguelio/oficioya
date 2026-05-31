import type { Review } from '@/features/dashboard/types'

export const mockReviews: Review[] = [
  // ── p1 — Héctor Antiñir (electricista, Bariloche) ─────────────────────────
  {
    id: 'r1',
    providerId: 'p1',
    authorName: 'Gastón M.',
    rating: 5,
    comment: 'Excelente trabajo. Vino puntual, solucionó el problema del tablero en una hora y dejó todo impecable. Lo recomiendo 100%.',
    createdAt: '2026-05-20T10:00:00Z',
  },
  {
    id: 'r2',
    providerId: 'p1',
    authorName: 'Laura V.',
    rating: 5,
    comment: 'Muy profesional. Explicó todo lo que iba haciendo y dio consejos para evitar futuros problemas. Precio justo.',
    createdAt: '2026-04-15T14:30:00Z',
  },
  {
    id: 'r3',
    providerId: 'p1',
    authorName: 'Diego P.',
    rating: 4,
    comment: 'Buen trabajo, tardó un poco más de lo esperado pero el resultado fue muy bueno. Volvería a contratarlo.',
    createdAt: '2026-03-08T09:00:00Z',
  },

  // ── p2 — Mirta Quintana (pintora, Bariloche) ──────────────────────────────
  {
    id: 'r4',
    providerId: 'p2',
    authorName: 'Familia Torres',
    rating: 5,
    comment: 'Pintó toda la casa en tres días. Prolijísima, cubrió bien los muebles y el resultado es espectacular. Ya la contratamos para la cabaña también.',
    createdAt: '2026-05-10T11:00:00Z',
  },
  {
    id: 'r5',
    providerId: 'p2',
    authorName: 'Romina A.',
    rating: 5,
    comment: 'Puntual, limpia y con muy buen ojo para los colores. Nos asesoró en la combinación y quedó hermoso.',
    createdAt: '2026-04-02T16:00:00Z',
  },
  {
    id: 'r6',
    providerId: 'p2',
    authorName: 'Jorge N.',
    rating: 4,
    comment: 'Muy buen trabajo en general. Le daría 5 estrellas si hubiera sido un poco más rápida en responder al inicio.',
    createdAt: '2026-02-18T08:30:00Z',
  },

  // ── p3 — Pablo Lagos (plomero, Bariloche) ─────────────────────────────────
  {
    id: 'r7',
    providerId: 'p3',
    authorName: 'Nora F.',
    rating: 5,
    comment: 'Resolvió una pérdida de agua que teníamos hace meses sin diagnóstico. Lo encontró en 20 minutos. Muy recomendable.',
    createdAt: '2026-05-28T09:00:00Z',
  },
  {
    id: 'r8',
    providerId: 'p3',
    authorName: 'Claudia M.',
    rating: 3,
    comment: 'Buen trabajo pero tardó mucho en confirmar el turno. El trabajo en sí estuvo bien.',
    createdAt: '2026-04-10T10:00:00Z',
  },

  // ── p4 — Rodolfo Mansilla (gasista, San Martín) ───────────────────────────
  {
    id: 'r9',
    providerId: 'p4',
    authorName: 'Marcela R.',
    rating: 5,
    comment: 'Instaló el calefactor perfecto. Muy ordenado y dejó todo listo para pasar el invierno. Sabe mucho.',
    createdAt: '2026-05-25T15:00:00Z',
  },
  {
    id: 'r10',
    providerId: 'p4',
    authorName: 'Gustavo O.',
    rating: 5,
    comment: 'Gasista de confianza. Ya lo usé tres veces y siempre resuelve todo de primera. Precio razonable.',
    createdAt: '2026-05-01T11:30:00Z',
  },
  {
    id: 'r11',
    providerId: 'p4',
    authorName: 'Rosa P.',
    rating: 4,
    comment: 'Muy buena atención y trabajo prolijo. Volvería a llamarlo sin dudarlo.',
    createdAt: '2026-03-20T14:00:00Z',
  },

  // ── p5 — Claudia Orellano (carpintera, San Martín) ────────────────────────
  {
    id: 'r12',
    providerId: 'p5',
    authorName: 'Héctor Q.',
    rating: 5,
    comment: 'Nos hizo el deck del jardín y quedó espectacular. Muy detallista y propuso mejoras que no habíamos pensado.',
    createdAt: '2026-05-18T10:00:00Z',
  },
  {
    id: 'r13',
    providerId: 'p5',
    authorName: 'Pablo L.',
    rating: 5,
    comment: 'Arreglamos los placards de toda la casa. Excelente calidad de trabajo y cumplió los tiempos al pie de la letra.',
    createdAt: '2026-04-20T09:30:00Z',
  },
]
