import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { publicacionSchema } from "@diego-porras/shared";
import { requireSession, logAuditoria } from "@/lib/auth";
import { emitPublicacion } from "@/lib/realtime";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    if (session.role === "CLIENTE") {
      const acceso = await prisma.proyectoCliente.findUnique({
        where: { proyectoId_userId: { proyectoId: id, userId: session.id } },
      });
      if (!acceso) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    const publicacion = await prisma.publicacionCliente.findFirst({
      where: { proyectoId: id, activa: true },
      include: {
        presupuesto: {
          include: { lineas: true, fuentePrecios: { select: { nombre: true } } },
        },
        publicador: { select: { name: true } },
        proyecto: { select: { nombre: true, ubicacion: true, moneda: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const timeline = await prisma.publicacionCliente.findMany({
      where: { proyectoId: id },
      select: {
        id: true,
        mensajeAdmin: true,
        nivelDetalle: true,
        createdAt: true,
        activa: true,
        publicador: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ publicacion, timeline });
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
    const parsed = publicacionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await prisma.publicacionCliente.updateMany({
      where: { proyectoId, activa: true },
      data: { activa: false },
    });

    const presupuesto = body.presupuestoId
      ? await prisma.presupuesto.findUnique({
          where: { id: body.presupuestoId },
          include: { lineas: true },
        })
      : null;

    const publicacion = await prisma.publicacionCliente.create({
      data: {
        proyectoId,
        presupuestoId: body.presupuestoId,
        publicadoPor: session.id,
        elementosVisibles: parsed.data.elementosVisibles,
        nivelDetalle: parsed.data.nivelDetalle,
        mensajeAdmin: parsed.data.mensajeAdmin,
        activa: true,
        snapshotJson: presupuesto
          ? {
              total: presupuesto.total,
              subtotal: presupuesto.subtotal,
              lineas: presupuesto.lineas,
            }
          : undefined,
      },
      include: { presupuesto: { include: { lineas: true } } },
    });

    emitPublicacion(proyectoId, publicacion.id);
    await logAuditoria("PUBLICAR", "PublicacionCliente", session.id, proyectoId, publicacion.id);

    return NextResponse.json(publicacion, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al publicar" }, { status: 500 });
  }
}
