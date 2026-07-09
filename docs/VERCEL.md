# Despliegue en Vercel — rama `fusion/mega-dp-cr`

## Requisitos

- Cuenta [Vercel](https://vercel.com) conectada a GitHub `kebara23/dp-cr`
- Base **PostgreSQL** (Neon recomendado; SQLite no funciona en serverless)

## 1. Base de datos (Neon)

1. Crear proyecto en [neon.tech](https://neon.tech) (plan gratuito).
2. Copiar dos URLs de conexión:
   - **Pooled** → `DATABASE_URL`
   - **Direct** → `DIRECT_URL` (migraciones / `db push`)

## 2. Proyecto Vercel

| Ajuste | Valor |
|--------|--------|
| **Root Directory** | `.` (raíz del monorepo) |
| **Framework** | Next.js |
| **Production Branch** | `fusion/mega-dp-cr` (o dejar preview por PR) |
| **Install Command** | `pnpm install` |
| **Build Command** | `pnpm vercel-build` |

El archivo [`vercel.json`](../vercel.json) en la raíz define install/build/output.

## 3. Variables de entorno

En Vercel → Project → Settings → Environment Variables:

| Variable | Entornos |
|----------|----------|
| `DATABASE_URL` | Production, Preview, Development |
| `JWT_SECRET` | Production, Preview (string largo aleatorio) |
| `NEXT_PUBLIC_APP_URL` | Production = URL de Vercel; Preview = URL preview |
| `BLOB_READ_WRITE_TOKEN` | Production, Preview, Development (Vercel Blob store) |
| `CRON_SECRET` | Opcional — protege `/api/jobs/procesar-lamina` |

### Subida de láminas (Fase A)

Los PDFs se suben **directo del navegador a Blob** (`@vercel/blob/client`), no pasan por el body de la Serverless Function (evita el límite 4.5 MB / error 413). Luego un job asíncrono descarga el archivo y extrae texto. OCR externo queda para Fase B.

Ejemplo producción:

```
NEXT_PUBLIC_APP_URL=https://dp-cr-fusion.vercel.app
```

### Blob (láminas)

```bash
vercel blob create-store dp-cr-laminas --access public --yes
```

Esto crea el store y enlaza `BLOB_READ_WRITE_TOKEN` al proyecto. Sin este token, en Vercel la subida de láminas falla.
## 4. Deploy

**Opción A — Git (recomendado):** push a `fusion/mega-dp-cr` → Vercel despliega preview automático.

**Opción B — CLI:**

```bash
cd apps/web
vercel link --yes --project dp-cr-fusion
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NEXT_PUBLIC_APP_URL
vercel --prod
```

El build ejecuta `prisma db push` + `seed` (usuarios demo) y luego `next build`.

## Credenciales demo (post-seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Super Admin | superadmin@dp-cr.app | super2026 |
| Admin Diego | admin@diego-porras.cr | admin123 |
| Admin Keilor | admin@keilor-barria.cr | admin123 |
| Cliente | cliente@ejemplo.cr | cliente123 |

## Desarrollo local con PostgreSQL

```bash
docker compose up -d
cp .env.example apps/web/.env
pnpm db:generate && pnpm db:push && pnpm db:seed
npm run dev
```
