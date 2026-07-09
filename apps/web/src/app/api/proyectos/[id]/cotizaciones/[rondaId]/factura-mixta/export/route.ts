import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";
import { buildFacturaMixtaPdf, buildFacturaMixtaXlsx } from "@/lib/cotizacion-export";

export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rondaId: string }> }
) {
  try {
    await requireSession();
    const { id: proyectoId, rondaId } = await params;
    const formato = req.nextUrl.searchParams.get("formato") ?? "xlsx";

    const factura = await prisma.facturaMixta.findFirst({
      where: { rondaId, ronda: { proyectoId } },
      include: {
        ronda: true,
        lineas: {
          include: { lineaMaterial: true, ferreteria: true },
        },
      },
    });
    if (!factura) {
      return NextResponse.json({ error: "Factura mixta no encontrada" }, { status: 404 });
    }

    const rows = factura.lineas.map((l) => ({
      ferreteriaNombre: l.ferreteria.nombre,
      descripcion: l.lineaMaterial.descripcion,
      unidad: l.lineaMaterial.unidad,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
      subtotal: l.subtotal,
    }));

    const totales = {
      totalOptimizado: factura.totalOptimizado,
      totalMejorGlobal: factura.totalMejorGlobal,
      ahorroEstimado: factura.ahorroEstimado,
    };

    if (formato === "pdf") {
      const buf = await buildFacturaMixtaPdf(factura.ronda.nombre, rows, totales);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="factura-mixta-${rondaId}.pdf"`,
        },
      });
    }

    const buf = await buildFacturaMixtaXlsx(factura.ronda.nombre, rows, totales);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="factura-mixta-${rondaId}.xlsx"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al exportar factura mixta" }, { status: 500 });
  }
}
