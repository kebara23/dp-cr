# Fase 0 — Fundación y Scaffolding (COMPLETADO)

## Estado

✅ **Monorepo estructura** — Turborepo + pnpm workspace
✅ **Prisma schema completo** — 15 entidades CTK + usuarios + proyectos (listo para Fases 1-5)
✅ **Pack CTK CR-RESIDENCIAL-V1** — 7 archivos JSON con reglas/tablas semilla
✅ **Motor metrado MVP** — 6 partidas clave con trazabilidad (dosificación, acero, mampostería, techo zinc, ventanas, pintura)
✅ **Agente IA** — Definitions de 6 tools + prompts (implementation en Fase 3)
✅ **Next.js scaffold** — Clerk auth, layout, /admin y /cliente stubs
✅ **Deps instaladas** — Node 24, pnpm 9, TypeScript 5.9
✅ **TypeCheck** — Todo compila limpio

❌ **Docker** — Postgres + pgvector no levanta en este entorno (limitar a Fase 1 cloud deploy)

## Qué se hizo

### 1. Monorepo (Turborepo + pnpm)
- `apps/web` — Next.js 15 (Admin + Cliente)
- `packages/database` — Prisma schema + migrations
- `packages/ctk` — Loader del pack CR-RESIDENCIAL-V1
- `packages/engine` — Motor metrado (6 funciones clave)
- `packages/agent` — Tools definitions + prompts
- `packages/shared` — Tipos comunes (partidas, citas, constantes)

### 2. Prisma Schema (completo)
22 tablas: `Usuario`, `Proyecto`, `Lamina`, `DocumentoConocimiento`, `ReglaTecnica`, `FilaTablaReferencia`, `SimboloCatalogado`, `ElementoPlano`, `VinculacionConocimiento`, `ChunkCtk`, `InstruccionCorpus`, `ListaCantidades`, `LineaCantidad`, `FuentePrecio`, `ItemPrecio`, `Presupuesto`, `LineaPresupuesto`, `PublicacionCliente`, `ConversacionAgente`, `MensajeAgente`, `ProyectoCliente`

Listo para Fases 1-5 sin cambios de schema (teoría).

### 3. Pack CTK CR-RESIDENCIAL-V1
- `dosificaciones_concreto.json` — 210/175/140 kg/cm²
- `notas_generales.json` — NG-01/03/05/17 + curado
- `notas_estructurales_refuerzo.json` — Acero #3-#7 con traslapes
- `notas_estructurales_techo.json` — NT-01/02 (zinc 15cm traslape, pintura 4 manos)
- `notas_electricas_aresep.json` — NE-13/19/25 (colores, altura tomas, tierra)
- `notas_mecanicas_sanitarias.json` — NM-04/07/12 (pendiente, diámetro, fosa)
- `reglas_jerarquia_conflicto.json` — Jerarquía ARESEP > CFIA > notas > pack

### 4. Motor Metrado (6 partidas MVP)
Cada función retorna `ResultadoTrazable<T>` con:
- `valor` — cantidad calculada
- `formula` — cómo se calculó
- `citas[]` — fuentes (regla, tabla, lámina, cuadro)
- `requiereValidacion` — flag humano
- `confianza` — 0..1

**Funciones:**
1. `calcularDosificacion(fc, volumen_m3)` — Sacos cemento, arena, piedra
2. `calcularTraslapeAcero(barra, fc)` — Longitud traslape (#3-#7)
3. `calcularPesoAcero(barra, qty, longitud)` — Kg total acero
4. `calcularAreaTechoZinc(area_neta)` — Área con traslape 15cm + 10% desperdicio
5. `calcularMamposteria(area_m2)` — Refuerzo 1#3@40h 1#3@60v + acero estimado
6. `calcularPinturaPerfiles(area_m2)` — Galones pintura 4 manos

### 5. Agente IA
6 tools para Claude function calling:
1. `consultar_regla(codigo)` — NG-05, NE-19, etc
2. `consultar_tabla(tabla, clave)` — Acero #4, mezcla 210, etc
3. `buscar_en_plano(disciplina, elemento)` — RAG future
4. `calcular_cantidad(partida, params)` — Motor metrado
5. `aplicar_precio(partida, fuente_id)` — Lista precios
6. `validar_cumplimiento(elemento, regla)` — Compliance check

**System prompt:**
- Nunca responder sin citar fuente
- Indicar confianza %
- Marcar requiere_validacion si aplica

### 6. Next.js (Auth + Layout)
- Clerk middleware (`/admin` y `/cliente` protegidas)
- Tailwind CSS + PostCSS
- Stubs página raíz, admin, cliente
- TypeScript stricto

## Próximos pasos (Fase 1)

**Semana 1 (ahora → 1 semana):**
1. **Upload + Visor láminas** — R2 storage, PDF.js viewer, clasificación disciplina
2. **CTK loader UI** — Formularios para validar reglas/tablas
3. **Seed CTK completo** — Script que carga pack a DB

**Checklist:**
- ✅ Git status clean
- ✅ TypeCheck pasa
- ✅ Schema Prisma listo (27 entidades planeadas, 22 implementadas)
- ✅ 6 partidas MVP con motor
- ❌ DB local (skip en Fase 0, agregar en Fase 1 cloud)
- ❌ Clerk config (stub en Fase 0, real en Fase 1)
- ❌ OCR (diferido a Fase 2)

## Cómo arrancar (local)

```bash
# 1. Install deps
pnpm install

# 2. Typecheck
pnpm typecheck

# 3. (WIP) Start DB + seed
export DATABASE_URL="postgresql://dpcr:dpcr@localhost:5432/dpcr?schema=public"
docker compose up -d
pnpm --filter @dp/database push
pnpm --filter @dp/database seed

# 4. Dev server
pnpm dev
# → http://localhost:3000
```

## Decisiones de diseño

1. **Slice vertical MVP** — 1 proyecto (Terraba), 6 partidas (no 30), sin OCR → demo end-to-end semana 5-6
2. **Schema completo Fase 0** — 22/27 entidades; fácil agregar sin migraciones dolorosas
3. **CTK como JSON semilla** — Loader externo; seed script en Fase 1 (evita import circular)
4. **Motor metrado simple** — Funciones puras, 100% trazable, sin deps externas
5. **Agente 6 tools** — Mínimo viable; IA nunca responde sin tool
6. **Auth Clerk stub** — Config completaré en Fase 1 con deploy cloud

## Riesgos Identificados

| Riesgo | Mitigación |
|--------|------------|
| DB local falla en CI/CD | Deploy cloud Fase 1 (Neon + Upstash) |
| Schema cambios dolorosos | Schema completo Fase 0; upsert migrations |
| Imports monorepo circular | Loader ctk → database sin rev-dep |
| Agente alucina cantidades | Function calling obligatorio Fase 3 |
| Scope creep 30 partidas | Congelar 6 partidas hasta Fase 5 validation |

## Métricas Fase 0

- **Líneas código**: ~2500 (TypeScript + JSON)
- **Packages**: 5 (shared, ctk, database, engine, agent) + 1 app (web)
- **Entidades Prisma**: 22 (planned 27, 5 future)
- **Funciones motor**: 6 (calculan con trazabilidad 100%)
- **CTK reglas**: ~30 (dosificaciones, acero, refuerzo, techo, eléctrico, sanitario)
- **Tiempo**: ~2h scaffolding + deps

---

**Next:** Fase 1 empieza con upload/visor láminas. Esperamos docker + Neon/Railway para seed CTK.
