# Agent: Persistent Search State
**Branch:** `feat/persistent-search-state` (commit `8f11fe8`)
**TypeScript:** PASS — zero errors

---

## Files Changed

| File | Change |
|------|--------|
| `src/features/search/store.ts` | Replaced `CityState` with `SearchState`. Added `rubroId: RubroId | null`, `setRubro`, `clearRubro`. Changed localStorage key `oficio-ciudad` → `oficio-search`. |
| `src/features/search/components/RubroPage.tsx` | Added `setRubro` selector. Extended mount `useEffect` to sync both ciudad + rubro URL params → store. Rubro pill `onClick` now calls `setRubro(r.id)` before navigating. |
| `src/features/search/components/HomePage.tsx` | Added `setRubro` selector. `handleRubro()` calls `setRubro` before navigating so store is pre-loaded before `RubroPage` mounts. |

## Design Decisions

- **URL params are source of truth** on navigation. Store is a persistence cache only.
- `useEffect` in `RubroPage` always reconciles URL → store (never store → URL), avoiding update loops.
- `oficio-search` key replaces `oficio-ciudad` — old key abandoned silently (fine at mock phase, no migration needed).
- `useProviders` hook signature and internals untouched.

## Follow-up

`clearCiudad()` does not automatically clear `rubroId`. Either:
- Have `clearCiudad` also call `clearRubro` inside the store, or
- Handle at call sites (e.g. OFICIO logo tap)
