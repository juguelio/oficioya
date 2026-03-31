# new-component

Crea un componente nuevo siguiendo las convenciones del proyecto Oficio.

## Instrucciones

1. Leé `.claude/skills/component-conventions.md` antes de escribir cualquier código.

2. El usuario va a pasarte el nombre del componente y opcionalmente la feature:
   - `/new-component Button` → va a `src/shared/components/`
   - `/new-component ProviderCard providers` → va a `src/features/providers/components/`

3. Creá siempre:
   - `ComponentName.tsx` con el componente tipado
   - `index.ts` con el barrel export (o actualizá el existente)

4. Confirmá al usuario:
   - Dónde quedó el archivo
   - Qué importar y desde dónde
   - Si hay algo que agregar al barrel `src/shared/components/index.ts`

## Ejemplo de uso

```
/new-component StarRating
/new-component ProviderCard providers
/new-component PricingTable subscriptions
```
