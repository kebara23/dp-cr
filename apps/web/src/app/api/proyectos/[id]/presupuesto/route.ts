import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession, logAuditoria } from "@/lib/auth";
import { calcularPresupuesto } from "@diego-porras/engine";
import { CAPITULOS } from "@diego-porras/shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const presupuestos = await prisma.presupuesto.findMany({
      where: { proyectoId: id },
      include: {
        lineas: true,
        fuentePrecios: true,
        listaCantidades: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(presupuestos);
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

    const fuente = await prisma.fuentePrecio.findUnique({
      where: { id: body.fuentePreciosId },
      include: { items: true },
    });
    if (!fuente) {
      return NextResponse.json({ error: "Fuente no encontrada" }, { status: 404 });
    }

    const preciosMap = new Map(
      fuente.items.map((i) => [i.codigo, { precio: i.precioUnitario, fuente: fuente.nombre }])
    );

    const resultado = calcularPresupuesto(
      lista.lineas.map((l) => ({
        partidaCodigo: l.partidaCodigo,
        descripcion: l.descripcion,
        unidad: l.unidad,
        cantidad: l.cantidad,
      })),
      preciosMap,
      body.margen ?? 15,
      body.impuestos ?? 13
    );

    const presupuesto = await prisma.presupuesto.create({
      data: {
        proyectoId,
        listaCantidadesId: lista.id,
        fuentePreciosId: fuente.id,
        tipo: body.tipo ?? "COTIZACION_CLIENTE",
        subtotal: resultado.subtotal,
        impuestos: resultado.impuestos,
        margen: body.margen ?? 15,
        total: resultado.total,
        validezDias: body.validezDias ?? 30,
        notasComerciales: body.notasComerciales,
        creadoPor: session.id,
        lineas: {
          create: resultado.lineas.map((l) => {
            const cap = CAPITULOS.find((c) => l.partidaCodigo.startsWith(c.codigo));
            return {
              partidaCodigo: l.partidaCodigo,
              capitulo: cap?.codigo ?? "00",
              descripcion: l.descripcion,
              unidad: l.unidad,
              cantidad: l.cantidad,
              precioUnitario: l.precioUnitario,
              subtotal: l.subtotal,
              fuentePrecioRef: l.fuente,
            };
          }),
        },
      },
      include: { lineas: true, fuentePrecios: true },
    });

    await logAuditoria("GENERAR", "Presupuesto", session.id, proyectoId, presupuesto.id);

    return NextResponse.json(presupuesto, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al generar presupuesto" }, { status: 500 });
  }
}
