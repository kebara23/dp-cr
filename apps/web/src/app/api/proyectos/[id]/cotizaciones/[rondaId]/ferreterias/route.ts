import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@diego-porras/database";
import { requireSession, logAuditoria } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rondaId: string }> }
) {
  try {
    const session = await requireSession(["ADMIN"]);
    const { id: proyectoId, rondaId } = await params;
    const body = await req.json();

    const ronda = await prisma.rondaCotizacion.findFirst({
      where: { id: rondaId, proyectoId },
    });
    if (!ronda) {
      return NextResponse.json({ error: "Ronda no encontrada" }, { status: 404 });
    }

    if (!body.nombre?.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const ferreteria = await prisma.ferreteria.create({
      data: {
        rondaId,
        nombre: body.nombre.trim(),
        contacto: body.contacto?.trim() || null,
        telefono: body.telefono?.trim() || null,
        email: body.email?.trim() || null,
      },
    });

    if (ronda.estado === "BORRADOR") {
      await prisma.rondaCotizacion.update({
        where: { id: rondaId },
        data: { estado: "ENVIADA_FERRETERIAS" },
      });
    }

    await logAuditoria("CREAR", "Ferreteria", session.id, proyectoId, ferreteria.id);

    return NextResponse.json(ferreteria, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al crear ferretería" }, { status: 500 });
  }
}
