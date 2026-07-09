import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession, logAuditoria } from "@/lib/auth";
import { explotarMateriales } from "@diego-porras/engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const rondas = await prisma.rondaCotizacion.findMany({
      where: { proyectoId: id },
      include: {
        _count: { select: { lineasMaterial: true, ferreterias: true, cotizaciones: true } },
        facturaMixta: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rondas);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id: proyectoId } = await params;
    const body = await req.json();

    const lista = await prisma.listaCantidades.findUnique({
      where: { id: body.listaCantidadesId },
      include: { lineas: true },
    });
    if (!lista || lista.proyectoId !== proyectoId) {
      return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 });
    }

    const materiales = explotarMateriales(
      lista.lineas.map((l) => ({
        partidaCodigo: l.partidaCodigo,
        descripcion: l.descripcion,
        unidad: l.unidad,
        cantidad: l.cantidad,
      }))
    );

    if (materiales.length === 0) {
      return NextResponse.json(
        { error: "La lista no tiene materiales explotables" },
        { status: 400 }
      );
    }

    const nombre =
      body.nombre?.trim() ||
      `Cotización materiales — lista v${lista.version}`;

    const ronda = await prisma.rondaCotizacion.create({
      data: {
        proyectoId,
        listaCantidadesId: lista.id,
        nombre,
        estado: "BORRADOR",
        creadoPor: session.id,
        lineasMaterial: {
          create: materiales.map((m) => ({
            origenPartida: m.origenPartida,
            descripcion: m.descripcion,
            unidad: m.unidad,
            cantidad: m.cantidad,
            categoria: m.categoria,
          })),
        },
      },
      include: { lineasMaterial: true },
    });

    await logAuditoria("GENERAR", "RondaCotizacion", session.id, proyectoId, ronda.id, {
      materiales: materiales.length,
      listaCantidadesId: lista.id,
    });

    return NextResponse.json(ronda, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al crear ronda" }, { status: 500 });
  }
}
