# add-provider

Agrega uno o más prestadores al mock data del proyecto Oficio.

## Instrucciones

1. Leé `.claude/skills/provider-data.md` antes de escribir cualquier código.

2. El usuario puede pasar los datos de forma libre:
   ```
   /add-provider electricista en Bariloche, zona Melipal
   /add-provider Mirta Soria, plomera, Villa La Angostura
   /add-provider 3 prestadores nuevos para San Martín
   ```

3. Con la info disponible, completá todos los campos del tipo `Provider`.
   Los datos que no se provean, generarlos de forma realista siguiendo
   las reglas del skill `provider-data.md`.

4. Agregá el/los prestadores al array en `src/data/mock-providers.ts`,
   manteniendo el orden por ciudad:
   - San Martín de los Andes primero
   - Villa La Angostura segundo
   - Bariloche tercero

5. Confirmá al usuario:
   - Cuántos prestadores se agregaron
   - Sus IDs y nombres
   - El nuevo total del array

## Ejemplo de uso

```
/add-provider gasista en Villa La Angostura
/add-provider Jorge Nahuel, cerrajero, San Martín, barrio Marinas
/add-provider 5 prestadores variados para Bariloche
```
