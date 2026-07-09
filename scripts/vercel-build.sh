#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Prisma migrate/push needs a direct (non-pooled) connection on Neon.
export DATABASE_URL="${DATABASE_URL_UNPOOLED:-${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:?DATABASE_URL is required}}}"

pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm --filter @diego-porras/web build
