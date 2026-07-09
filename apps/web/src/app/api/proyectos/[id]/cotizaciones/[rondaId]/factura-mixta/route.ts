import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession, logAuditoria } from "@/lib/auth";
import { calcularFacturaMixta } from "@diego-porras/engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rondaId: string }> }
) {
  try {
    await requireSession();
    const { id: proyectoId, rondaId } = await params;

    const factura = await prisma.facturaMixta.findFirst({
      where: { rondaId, ronda: { proyectoId } },
      include: {
        lineas: {
          include: { lineaMaterial: true, ferreteria: true },
        },
      },
    });

    if (!factura) {
      return NextResponse.json({ error: "Factura mixta no generada" }, { status: 404 });
    }

    return NextResponse.json(factura);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rondaId: string }> }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id: proyectoId, rondaId } = await params;

    const ronda = await prisma.rondaCotizacion.findFirst({
      where: { id: rondaId, proyectoId },
      include: {
        lineasMaterial: true,
        cotizaciones: {
          include: { lineas: true, ferreteria: true },
        },
      },
    });
    if (!ronda) {
      return NextResponse.json({ error: "Ronda no encontrada" }, { status: 404 });
    }

    const cotizacionesFlat = ronda.cotizaciones.flatMap((c) =>
      c.lineas
        .filter((l) => l.lineaMaterialId)
        .map((l) => ({
          id: l.id,
          lineaMaterialId: l.lineaMaterialId,
          ferreteriaId: c.ferreteriaId,
          precioUnitario: l.precioUnitario,
          cantidad: l.cantidad,
        }))
    );

    if (cotizacionesFlat.length === 0) {
      return NextResponse.json(
        { error: "No hay líneas matcheadas para generar factura mixta" },
        { status: 400 }
      );
    }

    const resultado = calcularFacturaMixta(
      ronda.lineasMaterial.map((m) => ({ id: m.id, cantidad: m.cantidad })),
      cotizacionesFlat
    );

    if (resultado.lineas.length === 0) {
      return NextResponse.json(
        { error: "No se pudo optimizar: faltan matches por material" },
        { status: 400 }
      );
    }

    await prisma.facturaMixta.deleteMany({ where: { rondaId } });

    const factura = await prisma.facturaMixta.create({
      data: {
        rondaId,
        totalOptimizado: resultado.totalOptimizado,
        totalMejorGlobal: resultado.totalMejorGlobal,
        ahorroEstimado: resultado.ahorroEstimado,
        generadoPor: session.id,
        lineas: {
          create: resultado.lineas.map((l) => ({
            lineaMaterialId: l.lineaMaterialId,
            ferreteriaId: l.ferreteriaId,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            subtotal: l.subtotal,
          })),
        },
      },
      include: {
        lineas: {
          include: { lineaMaterial: true, ferreteria: true },
        },
      },
    });

    await prisma.rondaCotizacion.update({
      where: { id: rondaId },
      data: { estado: "CERRADA" },
    });

    await logAuditoria(
      "GENERAR",
      "FacturaMixta",
      session.id,
      proyectoId,
      factura.id,
      {
        totalOptimizado: resultado.totalOptimizado,
        ahorroEstimado: resultado.ahorroEstimado,
      }
    );

    return NextResponse.json(factura, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al generar factura mixta" }, { status: 500 });
  }
}
