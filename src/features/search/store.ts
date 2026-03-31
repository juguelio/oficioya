import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CiudadId } from '@/design-system/tokens'

type CityState = {
  ciudadId: CiudadId | null
  setCiudad: (id: CiudadId) => void
  clearCiudad: () => void
}

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      ciudadId: null,
      setCiudad: (id) => set({ ciudadId: id }),
      clearCiudad: () => set({ ciudadId: null }),
    }),
    { name: 'oficio-ciudad' },
  ),
)
