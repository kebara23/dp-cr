import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma, Modulo } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";

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

export async function GET() {
  try {
    await requireSession(["SUPER_ADMIN"]);
    const tenants = await prisma.tenant.findMany({
      include: {
        modulos: true,
        _count: { select: { usuarios: true, proyectos: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(tenants);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(["SUPER_ADMIN"]);
    const body = await req.json();
    const { nombre, slug, modulos = [], adminEmail, adminName, adminPassword } = body;

    if (!nombre || !slug || !adminEmail || !adminName || !adminPassword) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const exists = await prisma.tenant.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json({ error: "Slug ya existe" }, { status: 400 });
    }

    const emailTaken = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (emailTaken) {
      return NextResponse.json({ error: "Email admin ya existe" }, { status: 400 });
    }

    const activos: Modulo[] = (modulos as string[]).filter((m): m is Modulo =>
      ALL_MODULOS.includes(m as Modulo)
    );

    const hash = await bcrypt.hash(adminPassword, 10);

    const tenant = await prisma.tenant.create({
      data: {
        nombre,
        slug,
        activo: true,
        modulos: {
          create: ALL_MODULOS.map((modulo) => ({
            modulo,
            activo: activos.includes(modulo),
          })),
        },
        usuarios: {
          create: {
            email: adminEmail,
            name: adminName,
            passwordHash: hash,
            role: "ADMIN",
          },
        },
      },
    });

    return NextResponse.json({ id: tenant.id, slug: tenant.slug });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al crear tenant" }, { status: 500 });
  }
}
