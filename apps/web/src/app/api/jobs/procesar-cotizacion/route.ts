import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";
import { procesarCotizacion } from "@/lib/procesar-cotizacion";

export const maxDuration = 60;

/** Reproceso manual de una cotización (útil si el job after() no corrió). */
export async function POST(req: NextRequest) {
  try {
    await requireSession(["ADMIN"]);
    const body = await req.json();
    if (!body.cotizacionId) {
      return NextResponse.json({ error: "cotizacionId requerido" }, { status: 400 });
    }

    const cotizacion = await prisma.cotizacionFerreteria.findUnique({
      where: { id: body.cotizacionId },
    });
    if (!cotizacion) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
    }

    await procesarCotizacion(cotizacion.id);

    const updated = await prisma.cotizacionFerreteria.findUnique({
      where: { id: cotizacion.id },
      include: { lineas: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
