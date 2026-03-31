# PROJECTS

Control central de los 3 proyectos activos.

---

## 1. Oficio — Marketplace de oficios Patagonia
**Estado:** 🟡 En desarrollo activo
**Stack:** React + Vite + TypeScript + Tailwind
**Repo:** `~/Documents/oficio`
**Prioridad ahora:** UI/diseño + RubroPage + PricingPage

### Qué está listo
- Setup completo (Vite, TS, Tailwind, router)
- Design system (tokens, CSS variables, tema oscuro)
- Shared components: Button, Badge, Avatar, StarRating, Card
- ProviderCard + useProviders hook
- Mock data con prestadores de SMA, VLA, Bariloche
- HomePage con selector ciudad + rubros
- RubroPage (placeholder)
- PricingPage (placeholder)
- Skills + commands en .claude/

### Próximo paso
- Skill de diseño → mejorar calidad visual de todas las páginas
- RubroPage con grilla real de ProviderCard
- PricingPage con diseño sólido

### Decisiones tomadas
- WhatsApp como CTA principal
- Suscripción solo para prestadores, clientes gratis
- Precios: Básico $20k / Profesional $35k / Destacado $55k ARS
- Mock data en fase 1, Supabase en fase 2

---

## 2. Proyecto Eli — Publishing
**Estado:** 🟢 Avanzado
**Prioridad ahora:** n8n + optimización de audios

### Notas
- Workflows de n8n en optimización
- Audio pipeline activo

---

## 3. [Tercer proyecto]
**Estado:** ⚪ Por definir

---

## Reglas de trabajo
- Un proyecto por sesión de Claude Code si es posible
- Cada proyecto tiene su propio SKILL.md con contexto completo
- Los commands en .claude/commands/ son la interfaz principal con Claude Code
- Los precios de Oficio se revisan cada 3 meses (inflación ARS)
