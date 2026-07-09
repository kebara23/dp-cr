import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["ADMIN"]);
    const { id } = await params;
    const disciplina = req.nextUrl.searchParams.get("disciplina");

    const reglas = await prisma.reglaTecnica.findMany({
      where: {
        documento: { proyectoId: id },
        ...(disciplina ? { disciplina: disciplina as never } : {}),
      },
      orderBy: { codigo: "asc" },
    });

    const tablas = await prisma.filaTablaReferencia.findMany({
      where: { documento: { proyectoId: id } },
      orderBy: [{ tablaId: "asc" }, { clave: "asc" }],
    });

    const simbolos = await prisma.simboloCatalogado.findMany({
      where: { documento: { proyectoId: id } },
    });

    const documentos = await prisma.documentoConocimiento.findMany({
      where: { proyectoId: id },
      include: {
        _count: { select: { reglasTecnicas: true, filasTabla: true, simbolos: true } },
      },
    });

    return NextResponse.json({ reglas, tablas, simbolos, documentos });
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id } = await params;
    const body = await req.json();

    if (body.accion === "validar_regla" && body.reglaId) {
      await prisma.reglaTecnica.update({
        where: { id: body.reglaId },
        data: { requiereValidacion: false },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.accion === "validar_documento" && body.documentoId) {
      await prisma.documentoConocimiento.update({
        where: { id: body.documentoId },
        data: { estado: "VALIDADO" },
      });
      await prisma.auditoriaEvento.create({
        data: {
          accion: "VALIDAR_CTK",
          entidad: "DocumentoConocimiento",
          entidadId: body.documentoId,
          userId: session.id,
          proyectoId: id,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.accion === "resolver_conflicto" && body.conflictoId) {
      await prisma.conflictoConocimiento.update({
        where: { id: body.conflictoId },
        data: { estado: "RESUELTO", resolucion: body.resolucion },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
