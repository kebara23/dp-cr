# Railway — Infraestructura Cloud

Proyecto: **dp-cr** (workspace kebara23's Projects)
Dashboard: https://railway.com/project/2c950825-78bd-4977-b3f2-d69514932df6

## Servicios

| Servicio | Imagen | Uso |
|----------|--------|-----|
| `postgres` | `pgvector/pgvector:pg16` | DB principal + embeddings CTK (pgvector) |
| `Redis` | `redis:8.2.1` | Cache + WebSockets (Fase 4) |

Ambos con volumen persistente (500MB) y TCP proxy público habilitado.

## Conexión

Variables reales en Railway (no commitear valores, solo estructura):

```bash
# Postgres
railway variables --service postgres --json

# Redis
railway variables --service Redis --json
```

`DATABASE_URL` y `REDIS_URL` van en `.env` local (gitignored). Formato:

```
DATABASE_URL="postgresql://<user>:<pass>@<tcp-proxy-domain>:<port>/dpcr?schema=public"
REDIS_URL="redis://default:<pass>@<tcp-proxy-domain>:<port>"
```

## Comandos útiles

```bash
railway status --json              # estado del proyecto
railway service list --json        # listar servicios
railway logs --service postgres    # logs de un servicio
railway connect postgres           # abre psql directo

# Aplicar schema Prisma
pnpm --filter @dp/database push --skip-generate

# Seed inicial (admin + proyecto Terraba + doc CTK)
pnpm --filter @dp/database seed
```

## Notas de configuración

- **PGDATA custom**: `pgvector/pgvector:pg16` sobre volumen montado en `/var/lib/postgresql/data` falla con `initdb: directory exists but is not empty` (contiene `lost+found`). Fix: variable `PGDATA=/var/lib/postgresql/data/pgdata` (subdirectorio dentro del mount).
- **TCP Proxy**: Postgres no expone dominio HTTP; se usa `railway tcp-proxy create --port 5432 --service postgres` para acceso externo (local dev, CI). Redis ya trae proxy por defecto (`REDIS_PUBLIC_URL`).
- Solo DB expuesta en Railway por ahora (decisión Fase 0). Next.js sigue local hasta configurar Clerk real — ver [Plan Maestro](../../../.claude/plans/name-plataforma-ingenier-a-idempotent-hennessy.md).

## Repo GitHub

https://github.com/kebara23/dp-cr (privado)
