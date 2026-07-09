import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rondaId: string }> }
) {
  try {
    await requireSession();
    const { id: proyectoId, rondaId } = await params;

    const ronda = await prisma.rondaCotizacion.findFirst({
      where: { id: rondaId, proyectoId },
      include: {
        lineasMaterial: { orderBy: { createdAt: "asc" } },
        ferreterias: {
          include: {
            cotizaciones: {
              include: { lineas: true },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        cotizaciones: {
          include: {
            ferreteria: true,
            lineas: true,
          },
          orderBy: { createdAt: "desc" },
        },
        facturaMixta: {
          include: {
            lineas: {
              include: { lineaMaterial: true, ferreteria: true },
            },
          },
        },
        listaCantidades: true,
      },
    });

    if (!ronda) {
      return NextResponse.json({ error: "Ronda no encontrada" }, { status: 404 });
    }

    return NextResponse.json(ronda);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
