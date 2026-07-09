import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { proyectoSchema } from "@diego-porras/shared";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireSession();
    if (session.role === "ADMIN") {
      const proyectos = await prisma.proyecto.findMany({
        where: session.tenantId
          ? { tenantId: session.tenantId }
          : { adminId: session.id },
        include: { _count: { select: { laminas: true, listasCantidades: true } } },
        orderBy: { updatedAt: "desc" },
      });
      return NextResponse.json(proyectos);
    }
    const accesos = await prisma.proyectoCliente.findMany({
      where: { userId: session.id },
      include: {
        proyecto: {
          include: { _count: { select: { laminas: true } } },
        },
      },
    });
    return NextResponse.json(accesos.map((a) => a.proyecto));
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["ADMIN"]);
    const body = await req.json();
    const parsed = proyectoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const proyecto = await prisma.proyecto.create({
      data: {
        ...parsed.data,
        adminId: session.id,
        tenantId: session.tenantId ?? undefined,
      },
    });
    return NextResponse.json(proyecto, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
