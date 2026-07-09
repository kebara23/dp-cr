import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📦 Seeding database...");

  // 1. Create admin user
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@dp-cr.test" },
    update: {},
    create: {
      email: "admin@dp-cr.test",
      nombre: "Admin DP-CR",
      rol: "admin",
    },
  });
  console.log("✅ Admin user:", admin.email);

  // 2. Create project Terraba
  const proyecto = await prisma.proyecto.upsert({
    where: { id: "proyecto-terraba-001" },
    update: {},
    create: {
      id: "proyecto-terraba-001",
      nombre: "Casa Residencial Terraba",
      propietario: "Diana Cortés Sánchez",
      cedula: "4-0022026-2025",
      planoCatastral: "6-0022026-2025",
      provincia: "Puntarenas",
      canton: "Osa",
      distrito: "Puerto Cortés",
      moneda: "CRC",
      tipoObra: "residencial",
      adminId: admin.id,
    },
  });
  console.log("✅ Project Terraba:", proyecto.nombre);

  // 3. Create documento base (CTK seed loader external in Fase 1)
  const documento = await prisma.documentoConocimiento.upsert({
    where: {
      id: "doc-cr-residencial-v1",
    },
    update: {},
    create: {
      id: "doc-cr-residencial-v1",
      proyectoId: proyecto.id,
      titulo: "CR Residencial V1 - Biblioteca global",
      disciplina: "general",
      fuente: "pack:cr-residencial-v1",
    },
  });
  console.log("✅ CTK document created (seed loader external)");

  console.log("✨ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
