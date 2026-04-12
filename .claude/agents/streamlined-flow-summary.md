# Agent: Streamlined Screen Flow
**Branch:** `feat/streamlined-flow`
**TypeScript:** PASS — zero errors

---

## Before vs After

| Visit type | Before | After |
|------------|--------|-------|
| Return visitor (ciudad persisted) | 5 steps | **3 steps** — `/` → tap rubro → tap WhatsApp |
| First visit | 5 steps | **4 steps** — `/` → tap city pill (inline) → tap rubro → tap WhatsApp |

### What was eliminated
- City selection is no longer a navigation step — pill-tabs are inline on HomePage, always above the fold (390×844)
- Provider profile page is no longer mandatory — WhatsApp CTA is inline on `RubroPage` provider cards
- Decorative search bar removed (was read-only, added noise)
- Redundant city chip in header removed (pills already show selection)

---

## Files Changed

| File | Change |
|------|--------|
| `src/features/search/components/HomePage.tsx` | City pills moved inline after hero. Hero reduced 530px → 400px. All 16 rubros visible at all times (opacity-60 until city selected). Decorative search bar removed. Header city chip removed. |
| `src/features/providers/components/ProviderProfile.tsx` | Fully implemented from stub: hero photo, badges, stats row, bio, WhatsApp CTA, formatted phone, 404 state. `navigate(-1)` back button. |
| `src/features/search/components/RubroPage.tsx` | WhatsApp CTA inline on each provider card (primary action). Photo/name tap → `/prestador/:id` (secondary). "Ver perfil completo →" low-prominence button added. |

---

## Trade-offs

- `/prestador/:id` still works for direct links/bookmarks — it's just no longer required in the main flow
- Inline WhatsApp on RubroPage means less profile context before contact — acceptable given the hyperlocal trust model (you're hiring someone local, not a stranger)
- Return visitors skip city selection entirely (Zustand persist) — first-time experience is 4 steps, which is already best-in-class for this category
