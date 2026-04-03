import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CiudadId, RubroId } from '@/design-system/tokens'

type SearchState = {
  ciudadId: CiudadId | null
  rubroId: RubroId | null
  setCiudad: (id: CiudadId) => void
  setRubro: (id: RubroId | null) => void
  clearCiudad: () => void
  clearRubro: () => void
}

export const useCityStore = create<SearchState>()(
  persist(
    (set) => ({
      ciudadId: null,
      rubroId: null,
      setCiudad: (id) => set({ ciudadId: id }),
      setRubro: (id) => set({ rubroId: id }),
      clearCiudad: () => set({ ciudadId: null, rubroId: null }),
      clearRubro: () => set({ rubroId: null }),
    }),
    { name: 'oficio-search' },
  ),
)
