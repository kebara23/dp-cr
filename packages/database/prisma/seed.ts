import { PrismaClient, Modulo } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const ALL_MODULOS: Modulo[] = [
  "LAMINAS",
  "CTK",
  "MOTOR_METRADO",
  "PRESUPUESTO",
  "AGENTE_IA",
  "PORTAL_CLIENTE",
  "AUDITORIA",
  "MANAGEMENT",
];

const KEILOR_MODULOS: Modulo[] = ["LAMINAS", "CTK", "PRESUPUESTO", "PORTAL_CLIENTE"];

function loadPackFile(filename: string) {
  const paths = [
    path.join(__dirname, "../../../data/ctk-packs/cr-residencial-v1", filename),
    path.join(process.cwd(), "data/ctk-packs/cr-residencial-v1", filename),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8"));
  }
  throw new Error(`Pack file not found: ${filename}`);
}

async function ensureModulos(tenantId: string, activos: Modulo[]) {
  for (const modulo of ALL_MODULOS) {
    await prisma.tenantModulo.upsert({
      where: { tenantId_modulo: { tenantId, modulo } },
      update: { activo: activos.includes(modulo) },
      create: { tenantId, modulo, activo: activos.includes(modulo) },
    });
  }
}

async function main() {
  await prisma.conflictoConocimiento.deleteMany({ where: { proyectoId: "demo-proyecto-terraba" } });
  await prisma.proyectoCliente.deleteMany({ where: { proyectoId: "demo-proyecto-terraba" } });
  const existing = await prisma.proyecto.findUnique({ where: { id: "demo-proyecto-terraba" } });
  if (existing) {
    await prisma.proyecto.delete({ where: { id: "demo-proyecto-terraba" } });
  }

  const adminHash = await bcrypt.hash("admin123", 10);
  const clienteHash = await bcrypt.hash("cliente123", 10);
  const superHash = await bcrypt.hash("super2026", 10);

  const tenantDiego = await prisma.tenant.upsert({
    where: { slug: "diego-porras" },
    update: { nombre: "Diego Porras", activo: true },
    create: {
      id: "tenant-diego-porras",
      nombre: "Diego Porras",
      slug: "diego-porras",
      activo: true,
    },
  });

  const tenantKeilor = await prisma.tenant.upsert({
    where: { slug: "keilor-barria" },
    update: { nombre: "Keilor Barría", activo: true },
    create: {
      id: "tenant-keilor-barria",
      nombre: "Keilor Barría",
      slug: "keilor-barria",
      activo: true,
    },
  });

  await ensureModulos(tenantDiego.id, ALL_MODULOS);
  await ensureModulos(tenantKeilor.id, KEILOR_MODULOS);

  await prisma.user.upsert({
    where: { email: "superadmin@dp-cr.app" },
    update: { role: "SUPER_ADMIN", passwordHash: superHash, name: "Super Admin DP-CR" },
    create: {
      email: "superadmin@dp-cr.app",
      passwordHash: superHash,
      name: "Super Admin DP-CR",
      role: "SUPER_ADMIN",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@diego-porras.cr" },
    update: { tenantId: tenantDiego.id, role: "ADMIN", passwordHash: adminHash },
    create: {
      email: "admin@diego-porras.cr",
      passwordHash: adminHash,
      name: "Ing. Diego Porras",
      role: "ADMIN",
      tenantId: tenantDiego.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@keilor-barria.cr" },
    update: { tenantId: tenantKeilor.id, role: "ADMIN", passwordHash: adminHash },
    create: {
      email: "admin@keilor-barria.cr",
      passwordHash: adminHash,
      name: "Ing. Keilor Barría",
      role: "ADMIN",
      tenantId: tenantKeilor.id,
    },
  });

  const cliente = await prisma.user.upsert({
    where: { email: "cliente@ejemplo.cr" },
    update: { tenantId: tenantDiego.id, role: "CLIENTE", passwordHash: clienteHash },
    create: {
      email: "cliente@ejemplo.cr",
      passwordHash: clienteHash,
      name: "Cliente Demo",
      role: "CLIENTE",
      tenantId: tenantDiego.id,
    },
  });

  const proyecto = await prisma.proyecto.upsert({
    where: { id: "demo-proyecto-terraba" },
    update: { tenantId: tenantDiego.id, adminId: admin.id },
    create: {
      id: "demo-proyecto-terraba",
      nombre: "Casa Residencial Terraba",
      descripcion: "Proyecto demo Puerto Cortés, Osa, Puntarenas",
      provincia: "Puntarenas",
      canton: "Osa",
      distrito: "Puerto Cortés",
      ubicacion: "Puerto Cortés, Osa, Puntarenas",
      tipoObra: "RESIDENCIAL",
      moneda: "CRC",
      propietario: "Diana Cortes Sanchez",
      cedulaProp: "1-1374-0389",
      planoCatastral: "6-0022026-2025",
      adminId: admin.id,
      tenantId: tenantDiego.id,
    },
  });

  await prisma.proyectoCliente.upsert({
    where: { proyectoId_userId: { proyectoId: proyecto.id, userId: cliente.id } },
    update: {},
    create: { proyectoId: proyecto.id, userId: cliente.id },
  });

  const packFiles = [
    { file: "notas_generales.json", tipo: "NOTAS_GENERALES" as const, titulo: "Notas Generales", disciplina: "GENERAL" as const },
    { file: "notas_electricas_aresep.json", tipo: "NOTAS_ELECTRICAS" as const, titulo: "Notas Eléctricas ARESEP", disciplina: "ELECTRICO" as const },
    { file: "notas_mecanicas_sanitarias.json", tipo: "NOTAS_MECANICAS" as const, titulo: "Notas Mecánicas CFIA", disciplina: "SANITARIO_MECANICO" as const },
    { file: "notas_estructurales_techo.json", tipo: "NOTAS_ESTRUCTURALES" as const, titulo: "Notas Estructurales Techo", disciplina: "ESTRUCTURA" as const },
    { file: "notas_estructurales_refuerzo.json", tipo: "NOTAS_ESTRUCTURALES" as const, titulo: "Notas Estructurales Refuerzo", disciplina: "ESTRUCTURA" as const },
  ];

  for (const pf of packFiles) {
    const reglas = loadPackFile(pf.file);
    const doc = await prisma.documentoConocimiento.create({
      data: {
        tipo: pf.tipo,
        disciplina: pf.disciplina,
        origen: "BIBLIOTECA_GLOBAL",
        titulo: pf.titulo,
        packId: "CR-RESIDENCIAL-V1",
        estado: "VALIDADO",
        proyectoId: proyecto.id,
      },
    });

    for (const r of reglas) {
      await prisma.reglaTecnica.create({
        data: {
          documentoId: doc.id,
          codigo: r.codigo,
          numero: r.numero,
          categoria: r.categoria,
          disciplina: r.disciplina,
          textoOriginal: r.textoOriginal,
          parametrosJson: r.parametrosJson ?? {},
          partidasAfectadas: r.partidasAfectadas ?? [],
          accionMotor: r.accionMotor,
          prioridad: r.prioridad ?? 0,
          requiereValidacion: r.requiereValidacion ?? false,
          packId: "CR-RESIDENCIAL-V1",
        },
      });
    }
  }

  const tablas = loadPackFile("tablas_referencia.json");
  const docTabla = await prisma.documentoConocimiento.create({
    data: {
      tipo: "TABLA_CENTRO_CARGA",
      disciplina: "ELECTRICO",
      origen: "BIBLIOTECA_GLOBAL",
      titulo: "Tablas de Referencia CR",
      packId: "CR-RESIDENCIAL-V1",
      estado: "VALIDADO",
      proyectoId: proyecto.id,
    },
  });

  for (const t of tablas) {
    await prisma.filaTablaReferencia.create({
      data: {
        documentoId: docTabla.id,
        tablaId: t.tablaId,
        clave: t.clave,
        columnasJson: t.columnasJson,
        unidadPrecio: t.unidadPrecio,
        partidaCodigo: t.partidaCodigo,
      },
    });
  }

  const simbolos = loadPackFile("simbologia.json");
  const docSim = await prisma.documentoConocimiento.create({
    data: {
      tipo: "SIMBOLOGIA_ELECTRICA",
      disciplina: "ELECTRICO",
      origen: "BIBLIOTECA_GLOBAL",
      titulo: "Simbología Eléctrica y Mecánica",
      packId: "CR-RESIDENCIAL-V1",
      estado: "VALIDADO",
      proyectoId: proyecto.id,
    },
  });

  for (const s of simbolos) {
    await prisma.simboloCatalogado.create({
      data: {
        documentoId: docSim.id,
        disciplina: s.codigo.startsWith("SYM-E") ? "ELECTRICO" : "SANITARIO_MECANICO",
        codigo: s.codigo,
        nombre: s.nombre,
        descripcion: s.descripcion,
        equivalenteMaterial: s.equivalenteMaterial,
        reglasAsociadas: s.reglasAsociadas ?? [],
        alturaInstalacionM: s.alturaInstalacionM,
      },
    });
  }

  const conflictos = loadPackFile("reglas_jerarquia_conflicto.json");
  const reglasDb = await prisma.reglaTecnica.findMany({ where: { packId: "CR-RESIDENCIAL-V1" } });

  for (const c of conflictos) {
    const reglaA = reglasDb.find((r) => r.codigo === c.reglaA);
    const reglaB = reglasDb.find((r) => r.codigo === c.reglaB);
    if (reglaA && reglaB) {
      await prisma.conflictoConocimiento.create({
        data: {
          proyectoId: proyecto.id,
          reglaAId: reglaA.id,
          reglaBId: reglaB.id,
          descripcion: c.descripcion,
          resolucion: c.resolucion,
          estado: "PENDIENTE",
        },
      });
    }
  }

  const fuente = await prisma.fuentePrecio.create({
    data: {
      nombre: "Proveedor Materiales CR Q3-2026",
      tipo: "proveedor",
      moneda: "CRC",
      vigenciaDesde: new Date("2026-07-01"),
      vigenciaHasta: new Date("2026-09-30"),
      confiabilidad: "alta",
    },
  });

  const preciosDemo = [
    { codigo: "02.01", descripcion: "Concreto f'c=210 kg/cm²", unidad: "m³", precio: 85000, categoria: "material" },
    { codigo: "02.02", descripcion: "Acero de refuerzo Grade 40", unidad: "kg", precio: 1200, categoria: "material" },
    { codigo: "03.01", descripcion: "Muro bloque 15cm", unidad: "m²", precio: 18500, categoria: "material" },
    { codigo: "05.01", descripcion: "Lámina zinc cal. 26", unidad: "m²", precio: 9500, categoria: "material" },
    { codigo: "05.05", descripcion: "Pintura anticorrosiva perfiles", unidad: "m²", precio: 3200, categoria: "material" },
    { codigo: "06.02", descripcion: "Ventana aluminio/vidrio", unidad: "m²", precio: 65000, categoria: "material" },
    { codigo: "07.01", descripcion: "Tubería PVC sanitaria Ø100mm", unidad: "ml", precio: 4500, categoria: "material" },
    { codigo: "07.03", descripcion: "Fosa séptica 1100L", unidad: "und", precio: 320000, categoria: "material" },
    { codigo: "09.01", descripcion: "Centro de carga 18 circuitos", unidad: "und", precio: 185000, categoria: "material" },
    { codigo: "09.04", descripcion: "Tomacorriente duplex", unidad: "und", precio: 3500, categoria: "material" },
  ];

  for (const p of preciosDemo) {
    const { precio, ...rest } = p;
    await prisma.itemPrecio.create({
      data: { fuenteId: fuente.id, ...rest, precioUnitario: precio },
    });
  }

  console.log("Seed multi-tenant completado:");
  console.log("  Super Admin: superadmin@dp-cr.app / super2026");
  console.log("  Admin Diego: admin@diego-porras.cr / admin123 (todos los módulos)");
  console.log("  Admin Keilor: admin@keilor-barria.cr / admin123 (sin Motor/Agente/Auditoría)");
  console.log("  Cliente: cliente@ejemplo.cr / cliente123");
  console.log("  Proyecto demo:", proyecto.nombre);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
