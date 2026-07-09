import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";
import { buildMaterialesPdf, buildMaterialesXlsx } from "@/lib/cotizacion-export";

export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rondaId: string }> }
) {
  try {
    await requireSession();
    const { id: proyectoId, rondaId } = await params;
    const formato = req.nextUrl.searchParams.get("formato") ?? "xlsx";

    const ronda = await prisma.rondaCotizacion.findFirst({
      where: { id: rondaId, proyectoId },
      include: { lineasMaterial: { orderBy: { createdAt: "asc" } } },
    });
    if (!ronda) {
      return NextResponse.json({ error: "Ronda no encontrada" }, { status: 404 });
    }

    const rows = ronda.lineasMaterial.map((m) => ({
      origenPartida: m.origenPartida,
      descripcion: m.descripcion,
      unidad: m.unidad,
      cantidad: m.cantidad,
      categoria: m.categoria,
    }));

    if (formato === "pdf") {
      const buf = await buildMaterialesPdf(ronda.nombre, rows);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="materiales-${rondaId}.pdf"`,
        },
      });
    }

    const buf = await buildMaterialesXlsx(ronda.nombre, rows);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="materiales-${rondaId}.xlsx"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
  }
}
