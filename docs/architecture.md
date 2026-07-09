# Arquitectura — Diego Porras

## Capas

1. **Presentación** — Next.js (`/admin`, `/cliente`)
2. **API** — Route handlers REST
3. **Núcleo** — packages `ctk`, `engine`, `agent`
4. **Datos** — Prisma + SQLite (dev) / PostgreSQL (prod)

## Flujo principal

Plano → Ingesta → CTK → Metrado → Presupuesto → Publicación → Cliente (SSE)

## Packages

- `@diego-porras/database` — Prisma schema (30+ entidades)
- `@diego-porras/ctk` — Pack CR-RESIDENCIAL-V1, clasificador láminas
- `@diego-porras/engine` — Dosificación, traslapes, metrado, presupuesto
- `@diego-porras/agent` — 9 tools, intent detection, 20 tests aceptación
- `@diego-porras/shared` — Zod schemas, 30 partidas MVP
