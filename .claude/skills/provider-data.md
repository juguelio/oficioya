# SKILL: provider-data

Convenciones para agregar, editar y mantener prestadores en el mock data de Oficio.

---

## Dónde viven los datos

```
src/data/
├── mock-providers.ts   ← todos los prestadores
├── mock-cities.ts      ← ciudades y zonas/barrios
└── rubros.ts           ← categorías (no editar salvo que se agregue un rubro nuevo)
```

---

## Tipo completo de un prestador

```ts
type Provider = {
  id: string                // 'p' + número secuencial: 'p1', 'p2', ...
  name: string              // Nombre y Apellido
  rubro: RubroId            // ver rubros disponibles abajo
  ciudad: CiudadId          // 'san-martin' | 'villa-la-angostura' | 'bariloche'
  barrio?: string           // zona dentro de la ciudad, en español
  phone: string             // formato: '+549XXXXXXXXXX' (sin espacios ni guiones)
  rating: number            // 0.0 a 5.0, con un decimal
  totalJobs: number         // trabajos completados (estimado realista)
  isVerified: boolean       // true solo si tiene documentación validada
  subscription: 'basico' | 'profesional' | 'destacado' | null
  status: 'active' | 'inactive' | 'pending'
  lat?: number              // coordenadas reales de la ciudad/barrio
  lng?: number
  bio?: string              // descripción en primera persona, tono cercano
  photos: string[]          // vacío en mock, se llena con Supabase Storage
  createdAt: string         // 'YYYY-MM-DD'
}
```

---

## Rubros disponibles (RubroId)

```
'electricista' | 'plomero' | 'gasista' | 'carpintero' |
'albanil' | 'pintor' | 'cerrajero' | 'jardinero' |
'calefaccionista' | 'herrero'
```

---

## Ciudades y coordenadas de referencia

| Ciudad | CiudadId | Lat | Lng |
|---|---|---|---|
| San Martín de los Andes | `san-martin` | -40.1573 | -71.3520 |
| Villa La Angostura | `villa-la-angostura` | -40.7583 | -71.6466 |
| Bariloche | `bariloche` | -41.1335 | -71.3103 |

Para `lat`/`lng` de un prestador, variar ±0.01 del centro de la ciudad
para simular distribución real en el mapa.

---

## Barrios / zonas por ciudad

**San Martín de los Andes**
Centro, Chapelco, Marinas, Arrayanes, Curruhuinca, Cumelén, Las Lengas

**Villa La Angostura**
Centro, Las Balsas, Bahía Mansa, Puerto Manzano, El Cruce

**Bariloche**
Centro, Melipal, Playa Bonita, Belgrano, Km 8, Km 12, El Faldeo, Arelauquen

---

## Reglas para datos realistas

- **Nombres:** usar nombres y apellidos comunes de la región (Mapuche + españoles)
  - Ejemplos: Rodolfo, Mirta, Pablo, Héctor, Gustavo, Rosa, Nora, Jorge, Claudia
  - Apellidos: Quintana, Lagos, Mansilla, Pereyra, Orellano, Fuentes, Antiñir, Nahuel

- **Ratings:** entre 4.5 y 5.0 para verificados. Entre 4.0 y 4.8 para no verificados.
  No poner 5.0 a no verificados.

- **totalJobs:** realista según antigüedad simulada.
  - < 6 meses → 10 a 40 trabajos
  - 6-12 meses → 40 a 100 trabajos
  - > 1 año → 80 a 250 trabajos

- **bio:** en primera persona, tono coloquial argentino, sin tuteo formal.
  Máximo 2 oraciones. Mencionar especialidad concreta.
  ✅ "Electricista matriculado con 12 años en la zona. Me especializo en instalaciones nuevas y tableros."
  ❌ "Soy un profesional dedicado que ofrece servicios de calidad."

- **phone:** prefijo Neuquén `+5492972` para SMA y VLA, Río Negro `+5492944` para Bariloche.

- **subscription:** distribución sugerida en mock —
  - 50% `profesional`
  - 25% `basico`
  - 15% `destacado`
  - 10% `null` (registrados pero sin plan activo)

---

## Ejemplo de prestador bien cargado

```ts
{
  id: 'p6',
  name: 'Claudia Fuentes',
  rubro: 'pintor',
  ciudad: 'bariloche',
  barrio: 'Melipal',
  phone: '+5492944678901',
  rating: 4.8,
  totalJobs: 76,
  isVerified: true,
  subscription: 'profesional',
  status: 'active',
  lat: -41.1290,
  lng: -71.3180,
  bio: 'Pintora con 8 años de experiencia en interiores y exteriores. Trabajo prolijo y en tiempo.',
  photos: [],
  createdAt: '2024-06-10',
},
```

---

## Checklist al agregar un prestador

- [ ] `id` secuencial y único
- [ ] `phone` con formato correcto y prefijo de área correcto
- [ ] `lat`/`lng` dentro del rango de la ciudad
- [ ] `bio` en primera persona, coloquial, específica
- [ ] `rating` consistente con `isVerified`
- [ ] `totalJobs` consistente con `createdAt`
- [ ] Agregado al array en `mock-providers.ts` (mantener orden por ciudad)
