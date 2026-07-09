import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession, logAuditoria } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; rondaId: string; lineaId: string }>;
  }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id: proyectoId, rondaId, lineaId } = await params;
    const body = await req.json();

    const linea = await prisma.lineaCotizacionFerreteria.findFirst({
      where: {
        id: lineaId,
        cotizacion: { rondaId, ronda: { proyectoId } },
      },
    });
    if (!linea) {
      return NextResponse.json({ error: "Línea no encontrada" }, { status: 404 });
    }

    if (body.lineaMaterialId) {
      const material = await prisma.lineaMaterial.findFirst({
        where: { id: body.lineaMaterialId, rondaId },
      });
      if (!material) {
        return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });
      }
    }

    const updated = await prisma.lineaCotizacionFerreteria.update({
      where: { id: lineaId },
      data: {
        lineaMaterialId: body.lineaMaterialId ?? null,
        matchManual: true,
        matchConfianza: body.lineaMaterialId ? 1 : 0,
      },
    });

    await logAuditoria(
      "AJUSTAR",
      "LineaCotizacionFerreteria",
      session.id,
      proyectoId,
      lineaId,
      { lineaMaterialId: body.lineaMaterialId ?? null }
    );

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al actualizar match" }, { status: 500 });
  }
}
