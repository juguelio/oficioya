# new-feature

Crea el scaffold completo de una feature nueva en el proyecto Oficio.

## Instrucciones

1. Leé `.claude/skills/feature-conventions.md` antes de escribir cualquier código.

2. El usuario pasa el nombre de la feature en singular o plural:
   ```
   /new-feature notifications
   ```

3. Creá la siguiente estructura completa:
   ```
   src/features/[nombre]/
   ├── components/
   │   └── index.ts        ← barrel vacío
   ├── hooks/
   │   └── index.ts        ← barrel vacío
   └── types.ts            ← tipos base de la feature
   ```

4. Si el usuario describe qué hace la feature, generá también:
   - El tipo principal en `types.ts`
   - Un hook base en `hooks/use[Nombre].ts`
   - Mock data en `src/data/mock-[nombre].ts`

5. Registrá las rutas nuevas en `src/app/Router.tsx` si aplica.

6. Confirmá al usuario:
   - Qué archivos se crearon
   - Qué falta completar
   - Si hay tipos para exportar desde `src/shared/types/index.ts`

## Ejemplo de uso

```
/new-feature notifications
/new-feature chat — para mensajes entre cliente y prestador
```
