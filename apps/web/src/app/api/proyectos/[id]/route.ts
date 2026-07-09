import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      include: {
        laminas: { orderBy: { codigo: "asc" } },
        documentosConocimiento: {
          include: {
            _count: { select: { reglasTecnicas: true, filasTabla: true, simbolos: true } },
          },
        },
        conflictos: { include: { reglaA: true, reglaB: true } },
        listasCantidades: { orderBy: { version: "desc" }, take: 5 },
        presupuestos: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!proyecto) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (session.role === "CLIENTE") {
      const acceso = await prisma.proyectoCliente.findUnique({
        where: { proyectoId_userId: { proyectoId: id, userId: session.id } },
      });
      if (!acceso) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    } else if (proyecto.adminId !== session.id) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    return NextResponse.json(proyecto);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
