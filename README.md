# Diego Porras — Plataforma de Ingeniería Civil

MVP de plataforma B2B para ingeniería civil en Costa Rica: ingesta de planos, Capa CTK (conocimiento técnico), metrados, presupuestos/cotizaciones, agente IA en chat live (Admin), y portal Cliente en tiempo real.

## Stack

- **Monorepo:** Turborepo + pnpm
- **Frontend/API:** Next.js 15, TypeScript, Tailwind
- **DB:** PostgreSQL 16 + Prisma
- **Packages:** `database`, `shared`, `ctk`, `engine`, `agent`

## Inicio rápido

```bash
# 1. Dependencias
pnpm install

# 2. Base de datos
# SQLite para desarrollo local (incluido). Para PostgreSQL en producción:
# docker compose up -d
# DATABASE_URL="postgresql://diego:diego@localhost:5432/diego_porras?schema=public"

# 3. Variables de entorno
cp .env.example apps/web/.env
# Ajustar DATABASE_URL con ruta absoluta si el login falla (carpeta con espacios en el nombre)

# 4. Schema y seed
pnpm db:generate
pnpm db:push
pnpm db:seed

# 5. Desarrollo (desde la raíz del proyecto)
npm run dev

Si el puerto 3000 está ocupado:
npm run dev:3001
```

Abrir http://localhost:3000

### Credenciales demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@diego-porras.cr | admin123 |
| Cliente | cliente@ejemplo.cr | cliente123 |

## Módulos

- **Admin:** proyectos, planos, CTK, metrado, presupuesto, agente IA, publicación
- **Cliente:** portal lectura + SSE tiempo real
- **Management:** fuentes de precio, pack CR-RESIDENCIAL-V1
- **CTK:** notas, tablas, simbología, conflictos
- **Agente:** 9 tools, RAG sobre pack, 20 tests aceptación

## Tests aceptación agente

```bash
pnpm --filter @diego-porras/agent test:acceptance
```

## Estructura

```
apps/web/          → Next.js Admin + Cliente
packages/database/ → Prisma schema
packages/ctk/      → Parser + pack CR
packages/engine/   → Motor metrado
packages/agent/    → Agente IA + tools
data/ctk-packs/    → JSON conocimiento técnico
docs/              → acceptance-tests.md
```
